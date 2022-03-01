const VM = require("@polygon-hermez/vm").default;
const Common = require("@ethereumjs/common").default;
const { Chain, Hardfork } = require("@ethereumjs/common");
const { Address, Account, BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');

const zkcommonjs = require("@polygon-hermez/zkevm-commonjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;
const { expect } = require("chai");
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require("fs");
const path = require("path");
const helpers = require("../helpers/helpers");
const artifactsPath = path.join(__dirname, "artifacts/contracts");

//example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update

describe("Generate inputs executor from test-vectors", async function () {
    this.timeout(20000);
    let poseidon;
    let F;
    let sequencerFees = 0;
    let inputName;
    let update;
    let testVectorDataPath;

    before(async () => {
        poseidon = await buildPoseidon();
        F = poseidon.F;
    });

    it("load test vectors", async () => {
        update = (argv.update) ? true : false;
        let file = (argv.vectors) ? argv.vectors : 'txs-calldata.json';
        file = file.endsWith('.json') ? file : file + '.json';
        inputName = (argv.inputs)? argv.inputs : ("input_" + file.replace(".json", "_"));
        testVectorDataPath = `../../../test-vector-data/${file}`;
        testVectors = require(testVectorDataPath);
        internalTestVectorsPath = `./generate-test-vectors/gen-${file}`;
        internalTestVectors = require(internalTestVectorsPath);
        await hre.run("compile");
    });

    it("Generate inputs", async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const output = {};
            let {
                id,
                sequencerAddress,
                arity,
                genesis,
                expectedOldRoot,
                txs,
                expectedNewRoot,
                chainIdSequencer,
                expectedNewLeafs,
                timestamp,
                defaultChainId
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            const common = Common.custom({ chainId: chainIdSequencer, hardfork: Hardfork.Berlin });
            let vm = new VM({ common });

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const smt = new zkcommonjs.SMT(db, arity, poseidon, poseidon.F);
            let root = F.zero;

            // NEW VM
            // setup new VM
            let newRoot = root;
            const contracts = [];
            output.contractsBytecode = {}
            for(let j = 0; j < genesis.length; j++) {
                const {address, balance, nonce, bytecode, storage} = genesis[j];
                const evmAddr = new Address(toBuffer(address));
                const acctData = {
                    nonce: Number(nonce),
                    balance: new BN(balance),
                }
                const account = Account.fromAccountData(acctData);
                await vm.stateManager.putAccount(evmAddr, account);

                // Update SMT
                newRoot = await zkcommonjs.stateUtils.setAccountState(address, smt, newRoot, acctData.balance, acctData.nonce);

                if(bytecode){
                    const hashByteCode = await zkcommonjs.smtUtils.hashContractBytecode(bytecode);
                    output.contractsBytecode[hashByteCode] = bytecode;
                    await vm.stateManager.putContractCode(evmAddr, toBuffer(bytecode));
                    newRoot = await zkcommonjs.stateUtils.setContractBytecode(address, smt, newRoot, bytecode);
                }

                if(storage) {
                    const keys = Object.keys(storage).map(v => toBuffer("0x" + v));
                    const values = Object.values(storage).map(v => toBuffer("0x" + v));
                    for (let k = 0; k < keys.length; k++){
                        await vm.stateManager.putContractStorage(evmAddr, keys[k], values[k]);
                    }
                    newRoot = await zkcommonjs.stateUtils.setContractStorage(address, smt, newRoot, storage);
                }
            }

            if(update)
                expectedOldRoot = helpers.stringToHex32(F.toString(newRoot), true);
            expect(helpers.stringToHex32(F.toString(newRoot), true)).to.be.equal(expectedOldRoot);

            output.oldStateRoot = expectedOldRoot;
            output.chainId = chainIdSequencer;
            output.db = await helpers.getSMT(newRoot, db, F);
            output.sequencerAddr = sequencerAddress;

            // TRANSACTIONS
            const txsList = [];
            for(let j = 0; j < txs.length; j++) {
                let currentTx = txs[j];
                let invalidTx = false;

                //CHECK TX DATA
                //check tx from
                let accountFrom = genesis.filter(x => x.address.toLowerCase() == currentTx.from.toLowerCase())[0];
                if (!accountFrom) {
                    // Ignore transaction
                    console.log("*******Tx Invalid --> Error: Invalid from address (tx ignored)");
                    continue;
                }
                const accountAddressFrom = new Address(toBuffer(accountFrom.address));
                const accountPkFrom = toBuffer(accountFrom.pvtKey);
                //prepare tx
                const txData = {
                    to: currentTx.to,
                    nonce: Number(currentTx.nonce),
                    value: new BN(currentTx.value),
                    data: currentTx.data,
                    gasLimit: new BN(currentTx.gasLimit),
                    gasPrice: new BN(currentTx.gasPrice),
                    chainId: new BN(currentTx.chainId)
                }
                const accountAddressTo = new Address(toBuffer(txData.to));
                const commonCustom = Common.custom({ chainId: txData.chainId, hardfork: Hardfork.Berlin });
                let tx = Transaction.fromTxData(txData, {common: commonCustom}).sign(accountPkFrom);
                if(currentTx.overwrite){
                    for (let paramOverwrite of Object.keys(currentTx.overwrite)) {
                        const txJSON = tx.toJSON();
                        txJSON[paramOverwrite] = currentTx.overwrite[paramOverwrite]
                        tx = Transaction.fromTxData(txJSON);
                    }
                }
                //check tx to
                if (!ethers.utils.isAddress(txData.to.toString(16))) {
                    console.log("*******Tx Invalid --> Error: Invalid to address");
                    // invalidTx = true;
                    continue;
                }
                //check tx chainId
                const sign = !(Number(tx.v) & 1);
                const chainId = (Number(tx.v) - 35) >> 1;
                if (chainId !== chainIdSequencer && chainId !== defaultChainId) {
                    console.log("*******Tx Invalid --> Error: Invalid chain id");
                    invalidTx = true;
                }
                // add tx to txList with customRawTx
                let messageToHash = [
                    tx.nonce.toString(16),
                    tx.gasPrice.toString(16),
                    tx.gasLimit.toString(16),
                    tx.to.toString(16),
                    tx.value.toString(16),
                    tx.data.toString("hex"),
                    ethers.utils.hexlify(chainId),
                    "0x",
                    "0x"
                ];
                for(let j = 0; j < messageToHash.length; j++) {
                    const param = messageToHash[j];
                    let newParam = param;
                    if(param == "0")
                        newParam = "0x"
                    else if (param.length % 2 != 0)
                        newParam = newParam.startsWith("0x") ? "0x0" + newParam.slice(2) : "0x0" + newParam;
                    else
                        newParam = newParam.startsWith("0x") ? newParam : "0x" + newParam;
                    messageToHash[j] = newParam;
                }
                const signData = ethers.utils.RLP.encode(messageToHash);
                let r = tx.r.toString(16).padStart(32 * 2, '0');
                let s = tx.s.toString(16).padStart(32 * 2, '0');
                let v = (sign + 27).toString(16).padStart(1 * 2, '0');
                const calldata = signData.concat(r).concat(s).concat(v);
                txsList.push(calldata);
                //check tx signature
                try {
                    const digest = ethers.utils.keccak256(signData);
                    fromAddr = ethers.utils.recoverAddress(digest, {
                        r: "0x" + r,
                        s: "0x" + s,
                        v: sign + 27
                    });
                } catch (error) {
                    console.log("*******Tx Invalid --> Error: Failed signature");
                    invalidTx = true;
                }
                //process vm tx if(!invalidTx)
                let resultTx;
                try {
                    if(!invalidTx)
                        resultTx = await vm.runTx({ tx });
                } catch(e){
                    //console invalid tx info
                    console.log("*******Tx Invalid --> ", e.toString().split(".")[0])
                    invalidTx = true;
                }
                // update state if(!invalidTx)
                if(!invalidTx){
                    //Sub fees&value from sender
                    const acctDataFrom = await vm.stateManager.getAccount(accountAddressFrom);
                    newRoot = await zkcommonjs.stateUtils.setAccountState(accountAddressFrom, smt, newRoot, acctDataFrom.balance, acctDataFrom.nonce);

                    //Update account receiver
                    const acctDataTo = await vm.stateManager.getAccount(accountAddressTo);
                    newRoot = await zkcommonjs.stateUtils.setAccountState(accountAddressTo, smt, newRoot, acctDataTo.balance, acctDataTo.nonce);

                    //Add fees to sequencer
                    const gasUsed = resultTx.gasUsed;
                    const gasPrice = currentTx.gasPrice;
                    sequencerFees = Scalar.mul(gasUsed, gasPrice);

                    const seqAddr = new Address(toBuffer(sequencerAddress));
                    const seqAcc = await vm.stateManager.getAccount(seqAddr);
                    const seqAccData = {
                        nonce: seqAcc.nonce,
                        balance: new BN(Scalar.add(sequencerFees, seqAcc.balance)),
                    };
                    await vm.stateManager.putAccount(seqAddr, Account.fromAccountData(seqAccData));
                    newRoot = await zkcommonjs.stateUtils.setAccountState(sequencerAddress, smt, newRoot, seqAccData.balance, seqAccData.nonce);

                    //Update contract storage
                    if(currentTx.to == "contract"){
                        const contract = contracts.filter(x => x.contractName == currentTx.contractName)[0];
                        const sto3 = await vm.stateManager.dumpStorage(contract.contractAddress);
                        let storage3 = {};

                        const keys3 = Object.keys(sto3).map(v => "0x" + v);
                        const values3 = Object.values(sto3).map(v => "0x" + v);
                        for (let k = 0; k < keys3.length; k++) {
                            storage3[keys3[k]] = values3[k];
                        }
                        newRoot = await zkcommonjs.stateUtils.setContractStorage(contract.contractAddress, smt, newRoot, storage3);
                    }
                }
            }

            let batchL2Data = "0x";
            for (let j = 0; j < txsList.length; j++) {
                batchL2Data = batchL2Data.concat(txsList[j].slice(2));
            }
            output.batchL2Data = batchL2Data;

            if(update)
                expectedNewRoot = helpers.stringToHex32(F.toString(newRoot), true);
            //Check new root
            expect(helpers.stringToHex32(F.toString(newRoot), true)).to.be.equal(expectedNewRoot);

            //TODO: delete
            //Check balances and nonces
            for (const [address] of Object.entries(expectedNewLeafs)) {
                const newLeaf = await zkcommonjs.stateUtils.getState(address, smt, newRoot);
                if(update)
                    expectedNewLeafs[address] = {balance: newLeaf.balance.toString(), nonce: newLeaf.nonce.toString()};
                expect(newLeaf.balance.toString()).to.equal(expectedNewLeafs[address].balance);
                expect(newLeaf.nonce.toString()).to.equal(expectedNewLeafs[address].nonce);
            }

            output.newStateRoot = expectedNewRoot;
            output.globalExitRoot = "0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9";
            output.newLocalExitRoot = "0x17c04c3760510b48c6012742c540a81aba4bca2f78b9d14bfd2f123e2e53ea3e";
            output.oldLocalExitRoot = "0x17c04c3760510b48c6012742c540a81aba4bca2f78b9d14bfd2f123e2e53ea3e";
            output.numBatch = 1;
            if(timestamp)
                output.timestamp = timestamp;
            else
                output.timestamp = 1944498032;
            if (!output.batchL2Data)
                output.batchL2Data = "0x";

            output.batchHashData = zkcommonjs.contractUtils.calculateBatchHashData(
                output.batchL2Data,
                output.globalExitRoot,
                output.timestamp,
                sequencerAddress,
                output.chainId,
                output.numBatch,
            );

            if(Object.keys(output.contractsBytecode).length === 0){
                output.contractsBytecode = undefined;
            }

            // Save outuput in file
            const dir = path.join(__dirname, '../../inputs/');
            await fs.writeFileSync(`${dir}${inputName}${id}.json`, JSON.stringify(output, null, 2));
            if(update){
                testVectors[i].expectedOldRoot = expectedOldRoot;
                testVectors[i].expectedNewRoot = expectedNewRoot;
                testVectors[i].expectedNewLeafs = expectedNewLeafs;
                internalTestVectors[i].expectedOldRoot = expectedOldRoot;
                internalTestVectors[i].expectedNewRoot = expectedNewRoot;
                internalTestVectors[i].expectedNewLeafs = expectedNewLeafs;
            }
        }
        if(update) {
            await fs.writeFileSync(testVectorDataPath, JSON.stringify(testVectors, null, 2));
            await fs.writeFileSync(internalTestVectorsPath, JSON.stringify(internalTestVectors, null, 2));
        }
    });
});

