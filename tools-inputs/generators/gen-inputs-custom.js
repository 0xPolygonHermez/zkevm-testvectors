/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const { BN } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');
const lodash = require('lodash');
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const paths = require('./paths.json');

const helpers = require(paths.helpers);

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
            testVectorDataPath = `../tools-calldata/generate-test-vectors/gen-${file}`;
            testVectors = require(testVectorDataPath);
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
                oldAccInputHash,
                historicGERRoot,
                timestamp,
                chainID,
                forkID,
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            if (!chainID) chainID = 1000;
            if (typeof oldAccInputHash === 'undefined') {
                oldAccInputHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            }
            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                db,
                poseidon,
                [F.zero, F.zero, F.zero, F.zero],
                zkcommonjs.smtUtils.stringToH4(oldAccInputHash),
                genesis,
                null,
                null,
                chainID,
                forkID,
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
            let options = {};
            options.skipVerifyGER = true;
            const extraData = { GERS: {} };
            const batch = await zkEVMDB.buildBatch(
                timestamp,
                sequencerAddress,
                zkcommonjs.smtUtils.stringToH4(historicGERRoot),
                0,
                Constants.DEFAULT_MAX_TX,
                options,
                extraData,
            );
            helpers.addRawTxChangeL2Block(batch, extraData, extraData);

            // TRANSACTIONS
            for (let j = 0; j < txs.length; j++) {
                const currentTx = txs[j];
                const accountFrom = genesis.filter((x) => x.address.toLowerCase() === currentTx.from.toLowerCase())[0];
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

                const signData = ethers.utils.RLP.encode([
                    zkcommonjs.processorUtils.toHexStringRlp(txData.nonce),
                    zkcommonjs.processorUtils.toHexStringRlp(txData.gasPrice),
                    zkcommonjs.processorUtils.toHexStringRlp(txData.gasLimit),
                    zkcommonjs.processorUtils.toHexStringRlp(txData.to),
                    zkcommonjs.processorUtils.toHexStringRlp(txData.value),
                    zkcommonjs.processorUtils.toHexStringRlp(txData.data),
                    zkcommonjs.processorUtils.toHexStringRlp(txData.chainId),
                    '0x',
                    '0x',
                ]);
                const digest = ethers.utils.keccak256(signData);
                const signingKey = new ethers.utils.SigningKey(accountFrom.pvtKey);
                const signature = signingKey.signDigest(digest);
                const r = signature.r.slice(2).padStart(64, '0'); // 32 bytes
                const s = signature.s.slice(2).padStart(64, '0'); // 32 bytes
                const v = (signature.v).toString(16).padStart(2, '0'); // 1 bytes
                if (typeof currentTx.effectivePercentage === 'undefined') {
                    currentTx.effectivePercentage = '0xff';
                }
                const calldata = signData.concat(r).concat(s).concat(v).concat(currentTx.effectivePercentage.slice(2));
                batch.addRawTx(calldata);
            }

            // Compare storage
            await batch.executeTxs();

            if (evmDebug) {
                try {
                    await generateEvmDebugFile(batch.evmSteps, `${file.split('.')[0]}-${i}.json`);
                } catch (e) {
                    console.log(`Can't generate evm debug file: ${e}`);
                }
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
                console.log(`WRITE: ${dir}${inputName}${id}.json`);
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
                testVectors[i].chainID = chainID;
                testVectors[i].oldAccInputHash = oldAccInputHash;
            }
        }
        if (update) {
            await fs.writeFileSync(path.join(__dirname, testVectorDataPath), JSON.stringify(testVectors, null, 2));
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
