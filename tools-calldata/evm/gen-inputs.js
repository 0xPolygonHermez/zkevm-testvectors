/* eslint-disable no-use-before-define */
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
const lodash = require('lodash');

const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const helpers = require('../helpers/helpers');

// example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update --output

describe('Generate inputs executor from test-vectors', async function () {
    this.timeout(100000);
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
    let evmDebug;
    let file;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('load test vectors', async () => {
        evmDebug = !!(argv['evm-debug']);
        outputFlag = !!(argv.output);
        if (argv.e2e) {
            file = 'e2e.json';
            testVectorDataPath = `../../state-transition/e2e/${file}`;
            testVectors = [require(testVectorDataPath)];
            inputsPath = '../../inputs-executor/e2e/';
            inputName = (`${file.replace('.json', '_')}`);
        } else {
            update = !!(argv.update);
            file = (argv.vectors) ? argv.vectors : 'txs-calldata.json';
            file = file.endsWith('.json') ? file : `${file}.json`;
            inputName = (argv.inputs) ? argv.inputs : (`${file.replace('.json', '_')}`);
            testVectorDataPath = `../../state-transition/calldata/${file}`;
            testVectors = require(testVectorDataPath);
            internalTestVectorsPath = `./generate-test-vectors/gen-${file}`;
            internalTestVectors = require(internalTestVectorsPath);
            inputsPath = '../../inputs-executor/calldata/';
        }

        await hre.run('compile');
        console.log(`   test vector name: ${file}`);
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
                sequencerAddress,
                expectedNewLeafs,
                oldLocalExitRoot,
                globalExitRoot,
                timestamp,
                chainID,
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            if (!chainID) chainID = 1000;

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                db,
                poseidon,
                [F.zero, F.zero, F.zero, F.zero],
                zkcommonjs.smtUtils.stringToH4(oldLocalExitRoot),
                genesis,
                null,
                null,
                chainID,
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

                const commonCustom = Common.custom({ chainId: txData.chainId }, { hardfork: Hardfork.Berlin });

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
                if (!ethers.utils.isAddress(txData.to.toString(16))) {
                    if (txData.to !== '0x') {
                        console.log('*******Tx Invalid --> Error: Invalid to address');
                        // invalidTx = true;
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    to = '0x';
                    const hashByteCode = await zkcommonjs.smtUtils.hashContractBytecode(currentTx.deployedBytecode);
                    const contractAddress = ethers.utils.getContractAddress({ from: accountFrom.address, nonce: txData.nonce });
                    output.contractsBytecode[contractAddress.toLowerCase()] = hashByteCode;
                } else {
                    to = tx.to;
                }
                // check tx chainId
                const sign = !(Number(tx.v) & 1);
                const txChainId = (Number(tx.v) - 35) >> 1;
                // add tx to txList with customRawTx
                const messageToHash = [
                    tx.nonce.toString(16),
                    tx.gasPrice.toString(16),
                    tx.gasLimit.toString(16),
                    to.toString(16),
                    tx.value.toString(16),
                    tx.data.toString('hex'),
                    ethers.utils.hexlify(txChainId),
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

            if (evmDebug) {
                await generateEvmDebugFile(batch.evmSteps, `${file.split('.')[0]}-${i}.json`);
            }

            await zkEVMDB.consolidate(batch);
            const circuitInput = await batch.getStarkInput();

            if (update) {
                expectedNewRoot = zkcommonjs.smtUtils.h4toString(batch.currentStateRoot);
            }
            // Check new root
            expect(zkcommonjs.smtUtils.h4toString(batch.currentStateRoot)).to.be.equal(expectedNewRoot);

            // Check balances and nonces
            // eslint-disable-next-line no-restricted-syntax
            for (const [address] of Object.entries(expectedNewLeafs)) {
                const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                if (update) { expectedNewLeafs[address] = { balance: newLeaf.balance.toString(), nonce: newLeaf.nonce.toString() }; }

                expect(newLeaf.balance.toString()).to.equal(expectedNewLeafs[address].balance);
                expect(newLeaf.nonce.toString()).to.equal(expectedNewLeafs[address].nonce);

                const storage = await zkEVMDB.dumpStorage(address);
                const hashBytecode = await zkEVMDB.getHashBytecode(address);
                const bytecodeLength = await zkEVMDB.getLength(address);
                if (update) { expectedNewLeafs[address].storage = storage; }
                expect(lodash.isEqual(storage, expectedNewLeafs[address].storage)).to.be.equal(true);

                if (update) {
                    expectedNewLeafs[address].hashBytecode = hashBytecode;
                    if (!output.contractsBytecode[address.toLowerCase()]) {
                        output.contractsBytecode[address.toLowerCase()] = hashBytecode;
                    }
                }
                expect(hashBytecode).to.equal(expectedNewLeafs[address].hashBytecode);

                if (update) {
                    expectedNewLeafs[address].bytecodeLength = bytecodeLength;
                }
                expect(lodash.isEqual(bytecodeLength, expectedNewLeafs[address].bytecodeLength)).to.be.equal(true);
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
                testVectors[i].oldLocalExitRoot = circuitInput.oldLocalExitRoot;
                internalTestVectors[i].batchL2Data = batch.getBatchL2Data();
                internalTestVectors[i].newLocalExitRoot = circuitInput.newLocalExitRoot;
                internalTestVectors[i].expectedOldRoot = expectedOldRoot;
                internalTestVectors[i].expectedNewRoot = expectedNewRoot;
                internalTestVectors[i].expectedNewLeafs = expectedNewLeafs;
                internalTestVectors[i].batchHashData = circuitInput.batchHashData;
                internalTestVectors[i].inputHash = circuitInput.inputHash;
                internalTestVectors[i].globalExitRoot = circuitInput.globalExitRoot;
                internalTestVectors[i].oldLocalExitRoot = circuitInput.oldLocalExitRoot;
                internalTestVectors[i].newLocalExitRoot = circuitInput.newLocalExitRoot;
            }
        }
        if (update) {
            await fs.writeFileSync(path.join(__dirname, testVectorDataPath), JSON.stringify(testVectors, null, 2));
            await fs.writeFileSync(path.join(__dirname, internalTestVectorsPath), JSON.stringify(internalTestVectors, null, 2));
        }
    });

    async function generateEvmDebugFile(evmTxSteps, fileName) {
        // Create dir if not exists
        const dir = path.join(__dirname, '/evm-stack-logs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const data = {};
        let txId = 0;
        for (const txSteps of evmTxSteps) {
            if (txSteps) {
                const stepObjs = [];
                for (const step of txSteps) {
                    if (step) {
                        // Format memory
                        let memory = step.memory.map((v) => v.toString(16)).join('').padStart(192, '0');
                        memory = memory.match(/.{1,32}/g); // split in 32 bytes slots
                        memory = memory.map((v) => `0x${v}`);

                        stepObjs.push({
                            pc: step.pc,
                            opcode: {
                                name: step.opcode.name,
                                fee: step.opcode.fee,
                            },
                            gasLeft: Number(`0x${step.gasLeft}`),
                            gasRefund: Number(`0x${step.gasRefund}`),
                            memory,
                            stack: step.stack.map((v) => `0x${v.toString('hex')}`),
                        });
                    }
                }
                data[txId] = stepObjs;
                txId += 1;
            }
        }
        fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2));
    }
});
