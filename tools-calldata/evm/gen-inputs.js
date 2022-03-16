/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');

const zkcommonjs = require('@polygon-hermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const helpers = require('../helpers/helpers');

// example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update --output

describe('Generate inputs executor from test-vectors', async function () {
    this.timeout(20000);
    let poseidon;
    let F;
    let inputName;
    let update;
    let outputFlag;
    let testVectorDataPath;
    let testVectors;
    let inputsPath;
    let internalTestVectors;
    let internalTestVectorsPath;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('load test vectors', async () => {
        update = !!(argv.update);
        outputFlag = !!(argv.output);
        let file = (argv.vectors) ? argv.vectors : 'txs-calldata.json';
        file = file.endsWith('.json') ? file : `${file}.json`;
        inputName = (argv.inputs) ? argv.inputs : (`input_${file.replace('.json', '_')}`);
        testVectorDataPath = `../../state-transition/calldata/${file}`;
        testVectors = require(testVectorDataPath);
        internalTestVectorsPath = `./generate-test-vectors/gen-${file}`;
        internalTestVectors = require(internalTestVectorsPath);
        inputsPath = '../../inputs-executor/calldata/';
        await hre.run('compile');
    });

    it('Generate inputs', async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const output = {};
            let {
                id,
                genesis,
                expectedOldRoot,
                txs,
                expectedNewRoot,
                chainIdSequencer,
                sequencerAddress,
                expectedNewLeafs,
                localExitRoot,
                globalExitRoot,
                timestamp,
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                db,
                poseidon,
                [F.zero, F.zero, F.zero, F.zero],
                zkcommonjs.smtUtils.stringToH4(localExitRoot),
                genesis,
            );

            // NEW VM
            // setup new VM
            output.contractsBytecode = {};
            for (let j = 0; j < genesis.length; j++) {
                const { bytecode } = genesis[j];
                if (bytecode) {
                    const hashByteCode = await zkcommonjs.smtUtils.hashContractBytecode(bytecode);
                    output.contractsBytecode[hashByteCode] = bytecode;
                }
            }

            if (update) {
                expectedOldRoot = zkcommonjs.smtUtils.h4toString(zkEVMDB.stateRoot);
            }
            expect(zkcommonjs.smtUtils.h4toString(zkEVMDB.stateRoot)).to.be.equal(expectedOldRoot);

            const batch = await zkEVMDB.buildBatch(
                timestamp,
                sequencerAddress,
                chainIdSequencer,
                zkcommonjs.smtUtils.stringToH4(globalExitRoot),
            );

            // TRANSACTIONS
            const txsList = [];
            for (let j = 0; j < txs.length; j++) {
                const currentTx = txs[j];
                const accountFrom = genesis.filter((x) => x.address.toLowerCase() === currentTx.from.toLowerCase())[0];
                if (!accountFrom) {
                    // Ignore transaction
                    console.log('*******Tx Invalid --> Error: Invalid from address (tx ignored)');
                    // eslint-disable-next-line no-continue
                    continue;
                }
                const accountPkFrom = toBuffer(accountFrom.pvtKey);
                // prepare tx
                const txData = {
                    to: currentTx.to,
                    nonce: Number(currentTx.nonce),
                    value: new BN(currentTx.value),
                    data: currentTx.data,
                    gasLimit: new BN(currentTx.gasLimit),
                    gasPrice: new BN(currentTx.gasPrice),
                    chainId: new BN(currentTx.chainId),
                };

                const commonCustom = Common.custom({ chainId: txData.chainId, hardfork: Hardfork.Berlin });
                let tx = Transaction.fromTxData(txData, { common: commonCustom }).sign(accountPkFrom);
                if (currentTx.overwrite) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const paramOverwrite of Object.keys(currentTx.overwrite)) {
                        const txJSON = tx.toJSON();
                        txJSON[paramOverwrite] = currentTx.overwrite[paramOverwrite];
                        tx = Transaction.fromTxData(txJSON);
                    }
                }
                // check tx to
                let to;
                output.bytecodelength = {};
                if (!ethers.utils.isAddress(txData.to.toString(16))) {
                    if (txData.to !== '0x') {
                        console.log('*******Tx Invalid --> Error: Invalid to address');
                        // invalidTx = true;
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    to = '0x';
                    output.bytecodelength[currentTx.from.toLowerCase() + currentTx.nonce] = currentTx.bytecodelength;
                } else {
                    to = tx.to;
                }
                // check tx chainId
                const sign = !(Number(tx.v) & 1);
                const chainId = (Number(tx.v) - 35) >> 1;
                // add tx to txList with customRawTx
                const messageToHash = [
                    tx.nonce.toString(16),
                    tx.gasPrice.toString(16),
                    tx.gasLimit.toString(16),
                    to.toString(16),
                    tx.value.toString(16),
                    tx.data.toString('hex'),
                    ethers.utils.hexlify(chainId),
                    '0x',
                    '0x',
                ];
                const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                const signData = ethers.utils.RLP.encode(newMessageToHash);
                const r = tx.r.toString(16).padStart(32 * 2, '0');
                const s = tx.s.toString(16).padStart(32 * 2, '0');
                const v = (sign + 27).toString(16).padStart(1 * 2, '0');
                const calldata = signData.concat(r).concat(s).concat(v);
                txsList.push(calldata);
                batch.addRawTx(calldata);
            }

            // Compare storage
            await batch.executeTxs();
            await zkEVMDB.consolidate(batch);
            const circuitInput = await batch.getStarkInput();

            if (update) {
                expectedNewRoot = zkcommonjs.smtUtils.h4toString(batch.currentStateRoot);
            }
            // Check new root
            expect(zkcommonjs.smtUtils.h4toString(batch.currentStateRoot)).to.be.equal(expectedNewRoot);

            // TODO: delete
            // Check balances and nonces
            // eslint-disable-next-line no-restricted-syntax
            for (const [address] of Object.entries(expectedNewLeafs)) {
                const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                if (update) { expectedNewLeafs[address] = { balance: newLeaf.balance.toString(), nonce: newLeaf.nonce.toString() }; }
                expect(newLeaf.balance.toString()).to.equal(expectedNewLeafs[address].balance);
                expect(newLeaf.nonce.toString()).to.equal(expectedNewLeafs[address].nonce);
            }

            for (const x in output) {
                circuitInput[x] = output[x];
            }
            // Save outuput in file
            if (outputFlag) {
                const dir = path.join(__dirname, inputsPath);
                await fs.writeFileSync(`${dir}${inputName}${id}.json`, JSON.stringify(circuitInput, null, 2));
            }
            if (update) {
                testVectors[i].batchL2Data = batch.getBatchL2Data();
                testVectors[i].expectedOldRoot = expectedOldRoot;
                testVectors[i].expectedNewRoot = expectedNewRoot;
                testVectors[i].expectedNewLeafs = expectedNewLeafs;
                testVectors[i].batchHashData = circuitInput.batchHashData;
                testVectors[i].inputHash = circuitInput.inputHash;
                testVectors[i].globalExitRoot = circuitInput.globalExitRoot;
                testVectors[i].localExitRoot = circuitInput.oldLocalExitRoot;
                internalTestVectors[i].newLocalExitRoot = circuitInput.newLocalExitRoot;
                internalTestVectors[i].expectedOldRoot = expectedOldRoot;
                internalTestVectors[i].expectedNewRoot = expectedNewRoot;
                internalTestVectors[i].expectedNewLeafs = expectedNewLeafs;
                internalTestVectors[i].batchHashData = circuitInput.batchHashData;
                internalTestVectors[i].inputHash = circuitInput.inputHash;
                internalTestVectors[i].globalExitRoot = circuitInput.globalExitRoot;
                internalTestVectors[i].localExitRoot = circuitInput.oldLocalExitRoot;
                internalTestVectors[i].newLocalExitRoot = circuitInput.newLocalExitRoot;
            }
        }
        if (update) {
            await fs.writeFileSync(path.join(__dirname, testVectorDataPath), JSON.stringify(testVectors, null, 2));
            await fs.writeFileSync(path.join(__dirname, internalTestVectorsPath), JSON.stringify(internalTestVectors, null, 2));
        }
    });
});
