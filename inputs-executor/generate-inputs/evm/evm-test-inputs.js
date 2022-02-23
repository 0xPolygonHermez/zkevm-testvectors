const VM = require("@ethereumjs/vm").default;
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

//example: npx mocha evm-test-inputs.js --vectors txs-calldata --update

describe("Deploy and interact with TEST in the EVMjs", async function () {
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
        switch (file) {
            case 'txs-calldata.json':
                inputName = 'input_txs_';
                break;
            case 'chain-ids.json':
                inputName = 'input_ci_';
                break;
            case 'nonces.json':
                inputName = 'input_n_';
                break;
            case 'balances.json':
                inputName = 'input_b_';
                break;
            case 'seq-fees.json':
                inputName = 'input_seq_fees_';
                break;
            case 'calldata-op-arith.json':
                inputName = 'input_op_arith_';
                break;
            case 'calldata-op-block.json':
                inputName = 'input_op_block_';
                break;
            case 'calldata-op-compbit.json':
                inputName = 'input_op_compbit_';
                break;
            case 'calldata-op-env.json':
                inputName = 'input_op_env_';
                break;
            case 'calldata-op-flow.json':
                inputName = 'input_op_flow_';
                break;
            case 'calldata-op-log.json':
                inputName = 'input_op_log_';
                break;
            case 'calldata-op-push.json':
                inputName = 'input_op_push_';
                break;
            case 'calldata-op-sha3.json':
                inputName = 'input_op_sha3_';
                break;
            case 'calldata-op-syst.json':
                inputName = 'input_op_syst_';
                break;
            case 'state-transition.json':
                inputName = "input_";
                break;
            default:
                inputName = 'input_X_'
        }
        testVectorDataPath = `../../../test-vector-data/${file}`;
        testVectors = require(testVectorDataPath);
        await hre.run("compile");
    });

    it("Should check test vectors", async () => {
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
            let vm2 = new VM({ common });

            if(!genesis.accounts){
                console.log("Error: account genesis required");
                process.exit(1);
            }

            const accountDeploy = genesis.accounts[0];
            const contracts = [];
            if(genesis.contracts) {
                //Create account with balance
                const accountPk = toBuffer(accountDeploy.pvtKey);
                const accountAddress = Address.fromPrivateKey(accountPk);
                const acctDataDeploy = {
                    nonce: 0,
                    balance: new BN(10).pow(new BN(18)), // 1 eth
                }
                const account = Account.fromAccountData(acctDataDeploy);
                await vm.stateManager.putAccount(accountAddress, account);
                //Deploy contracts
                for(let j = 0; j < genesis.contracts.length; j++){
                    const contractName = genesis.contracts[j].contractName;
                    const { abi, bytecode } = require(`${artifactsPath}/${contractName}.sol/${contractName}.json`);
                    const interface = new ethers.utils.Interface(abi);
                    const contractAddress = await helpers.deployContract(vm, accountPk, bytecode);
                    const contract = {
                        contractName,
                        contractAddress,
                        interface
                    };
                    contracts.push(contract);
                }
            }

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const smt = new zkcommonjs.SMT(db, arity, poseidon, poseidon.F);
            let root = F.zero;

            // NEW VM
            // setup new VM

            let newRoot = root;
            // GENESIS
            // add accounts
            for(let j = 0; j < genesis.accounts.length; j++) {
                const {address, balance, nonce} = genesis.accounts[j];
                const evmAddr = new Address(toBuffer(address));
                const acctData = {
                    nonce: Number(nonce),
                    balance: new BN(balance), // 1 eth
                }
                const account = Account.fromAccountData(acctData);
                await vm2.stateManager.putAccount(evmAddr, account);
                // Update SMT
                newRoot = await zkcommonjs.stateUtils.setAccountState(address, smt, newRoot, acctData.balance, acctData.nonce);
            }
            // add contract account
            // add contract bytecode
            for(let j = 0; j < contracts.length; j++) {
                const contract = contracts[j];
                const sto = await vm.stateManager.dumpStorage(contract.contractAddress);
                const smCode = await vm.stateManager.getContractCode(contract.contractAddress);

                const accountContract = {
                    nonce: 0,
                    balance: 0,
                }
                const smAcc = Account.fromAccountData(accountContract);
                await vm2.stateManager.putAccount(contract.contractAddress, smAcc);
                await vm2.stateManager.putContractCode(contract.contractAddress, smCode);

                // add contract storage
                const keys = Object.keys(sto).map(v => toBuffer("0x" + v));
                const values = Object.values(sto).map(v => toBuffer("0x" + v));

                for (let j = 0; j < keys.length; j++){
                    await vm2.stateManager.putContractStorageRaw(contract.contractAddress, keys[j], values[j]);
                }
                newRoot = await zkcommonjs.stateUtils.setContractBytecode(contract.contractAddress, smt, newRoot, smCode.toString("hex"));

                const sto2 = await vm2.stateManager.dumpStorage(contract.contractAddress);
                let storage2 = {};

                const keys2 = Object.keys(sto2).map(v => "0x" + v);
                const values2 = Object.values(sto2).map(v => "0x" + v);
                for (let k = 0; k < keys2.length; k++) {
                    storage2[keys2[k]] = values2[k];
                }
                newRoot = await zkcommonjs.stateUtils.setContractStorage(contract.contractAddress, smt, newRoot, storage2);
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
                let txData;
                let invalidTx = false;

                //CHECK TX DATA
                //check tx from
                let accountFrom = genesis.accounts.filter(x => x.address.toLowerCase() == currentTx.from.toLowerCase())[0];
                if (!accountFrom) {
                    // Ignore transaction
                    console.log("*******Tx Invalid --> Error: Invalid from address (tx ignored)");
                    continue;
                }
                const accountAddressFrom = new Address(toBuffer(accountFrom.address));
                const accountPkFrom = toBuffer(accountFrom.pvtKey);
                let accountAddressTo;

                //prepare tx
                if(currentTx.to == "contract") {
                    const contract = contracts.filter(x => x.contractName == currentTx.contractName)[0];
                    const functionData = contract.interface.encodeFunctionData(currentTx.function, currentTx.params);
                    txData = {
                        to: contract.contractAddress,
                        value: new BN(currentTx.value),
                        gasLimit: new BN(currentTx.gasLimit),
                        gasPrice: new BN(currentTx.gasPrice),
                        data: functionData,
                        nonce: Number(currentTx.nonce),
                        chainId: new BN(currentTx.chainId)
                    }
                    accountAddressTo = new Address(toBuffer(contract.contractAddress));
                } else {
                    txData = {
                        to: currentTx.to,
                        nonce: Number(currentTx.nonce),
                        value: new BN(currentTx.value),
                        gasLimit: new BN(currentTx.gasLimit),
                        gasPrice: new BN(currentTx.gasPrice),
                        chainId: new BN(currentTx.chainId)
                    }
                    accountAddressTo = new Address(toBuffer(txData.to));
                }
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
                        resultTx = await vm2.runTx({ tx });
                } catch(e){
                    //console invalid tx info
                    console.log("*******Tx Invalid --> ", e.toString().split(".")[0])
                    invalidTx = true;
                }
                // update state if(!invalidTx)
                if(!invalidTx){
                    //Sub fees&value from sender
                    const acctDataFrom = await vm2.stateManager.getAccount(accountAddressFrom);
                    newRoot = await zkcommonjs.stateUtils.setAccountState(accountAddressFrom, smt, newRoot, acctDataFrom.balance, acctDataFrom.nonce);

                    //Update account receiver
                    const acctDataTo = await vm2.stateManager.getAccount(accountAddressTo);
                    newRoot = await zkcommonjs.stateUtils.setAccountState(accountAddressTo, smt, newRoot, acctDataTo.balance, acctDataTo.nonce);

                    //Add fees to sequencer
                    const gasUsed = resultTx.gasUsed;
                    const gasPrice = currentTx.gasPrice;
                    sequencerFees = Scalar.mul(gasUsed, gasPrice);

                    const seqAddr = new Address(toBuffer(sequencerAddress));
                    const seqAcc = await vm2.stateManager.getAccount(seqAddr);
                    const seqAccData = {
                        nonce: seqAcc.nonce,
                        balance: new BN(Scalar.add(sequencerFees, seqAcc.balance)),
                    };
                    await vm2.stateManager.putAccount(seqAddr, Account.fromAccountData(seqAccData));
                    newRoot = await zkcommonjs.stateUtils.setAccountState(sequencerAddress, smt, newRoot, seqAccData.balance, seqAccData.nonce);

                    //Update contract storage
                    if(currentTx.to == "contract"){
                        const contract = contracts.filter(x => x.contractName == currentTx.contractName)[0];
                        const sto3 = await vm2.stateManager.dumpStorage(contract.contractAddress);
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
                output.chainId
            );

            // Save outuput in file
            const dir = path.join(__dirname, '../../inputs/');
            await fs.writeFileSync(`${dir}${inputName}${id}.json`, JSON.stringify(output, null, 2));
            if(update){
                testVectors[i].expectedOldRoot = expectedOldRoot;
                testVectors[i].expectedNewRoot = expectedNewRoot;
                testVectors[i].expectedNewLeafs = expectedNewLeafs;
            }
        }
        if(update)
            await fs.writeFileSync(testVectorDataPath, JSON.stringify(testVectors, null, 2));
    });
});

