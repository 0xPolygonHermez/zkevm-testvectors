/* eslint-disable */ 
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

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            let root = F.zero;
            const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                db,
                arity,
                poseidon,
                root,
                root,
                genesis,
            );
            // NEW VM
            // setup new VM
            output.contractsBytecode = {}
            for(let j = 0; j < genesis.length; j++) {
                const {deployedBytecode} = genesis[j];    

                if(deployedBytecode){
                    const hashByteCode = await zkcommonjs.smtUtils.hashContractBytecode(deployedBytecode);
                    output.contractsBytecode[hashByteCode] = deployedBytecode;
                }
            }

            if(update)
                expectedOldRoot = helpers.stringToHex32(F.toString(zkEVMDB.stateRoot), true);
            expect(helpers.stringToHex32(F.toString(zkEVMDB.stateRoot), true)).to.be.equal(expectedOldRoot);

            output.oldStateRoot = expectedOldRoot;
            output.chainId = chainIdSequencer;
            output.db = await helpers.getSMT(zkEVMDB.stateRoot, db, F);
            output.sequencerAddr = sequencerAddress;

            output.newStateRoot = expectedNewRoot;
            output.globalExitRoot = "0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9";
            output.newLocalExitRoot = "0x17c04c3760510b48c6012742c540a81aba4bca2f78b9d14bfd2f123e2e53ea3e";
            output.oldLocalExitRoot = "0x17c04c3760510b48c6012742c540a81aba4bca2f78b9d14bfd2f123e2e53ea3e";
            output.numBatch = 1;

            const batch = await zkEVMDB.buildBatch(timestamp, sequencerAddress, chainIdSequencer, F.e(Scalar.e(output.globalExitRoot)));

            // TRANSACTIONS
            const txsList = [];
            for(let j = 0; j < txs.length; j++) {
                let currentTx = txs[j];
                let accountFrom = genesis.filter(x => x.address.toLowerCase() == currentTx.from.toLowerCase())[0];
                if (!accountFrom) {
                    // Ignore transaction
                    console.log("*******Tx Invalid --> Error: Invalid from address (tx ignored)");
                    continue;
                }
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
                batch.addRawTx(calldata)                             
            }

            //Compare storage
            await batch.executeTxs();
            await zkEVMDB.consolidate(batch);
            const newRoot2 = batch.currentStateRoot;
            const circuitInput = await batch.getCircuitInput();
            output.batchL2Data = batch.getBatchL2Data();

            if(update)
                expectedNewRoot = helpers.stringToHex32(F.toString(batch.currentStateRoot), true);
            //Check new root
            expect(helpers.stringToHex32(F.toString(batch.currentStateRoot), true)).to.be.equal(expectedNewRoot);

            //TODO: delete
            //Check balances and nonces
            for (const [address] of Object.entries(expectedNewLeafs)) {
                const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                if(update)
                    expectedNewLeafs[address] = {balance: newLeaf.balance.toString(), nonce: newLeaf.nonce.toString()};
                expect(newLeaf.balance.toString()).to.equal(expectedNewLeafs[address].balance);
                expect(newLeaf.nonce.toString()).to.equal(expectedNewLeafs[address].nonce);
            }

            if(timestamp)
                output.timestamp = timestamp;
            else
                output.timestamp = 1944498032;
            if (!output.batchL2Data)
                output.batchL2Data = "0x";

            output.batchHashData = circuitInput.batchHashData;

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
            await fs.writeFileSync(path.join(__dirname, testVectorDataPath), JSON.stringify(testVectors, null, 2));
            await fs.writeFileSync(path.join(__dirname, internalTestVectorsPath), JSON.stringify(internalTestVectors, null, 2));
        }
    });
});

