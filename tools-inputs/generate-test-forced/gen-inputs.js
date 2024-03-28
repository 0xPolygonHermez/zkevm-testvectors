/* eslint-disable no-continue */
/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');

const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');
const lodash = require('lodash');
const { Scalar } = require('ffjavascript');

const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');
const { Constants, l1InfoTreeUtils } = require('@0xpolygonhermez/zkevm-commonjs');

const { argv } = require('yargs');
const helpers = require('../helpers/helpers');

// example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update --output

describe('Generate inputs executor from test-vectors', async function () {
    this.timeout(100000);
    let poseidon;
    let F;
    let update;
    let listTestVectors;
    let testVectors;
    let evmDebug;
    let file;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('load test vectors', async () => {
        update = !!argv.update;
        listTestVectors = fs.readdirSync(path.join(__dirname, './sources'));
        listTestVectors = fs.readdirSync(path.join(__dirname, './sources')).filter((x) => !x.startsWith('eth-') && !x.startsWith('in-') && !x.startsWith('general'));
        await hre.run('compile');
        console.log(`   test vector name: ${file}`);
    });

    it('Generate inputs', async () => {
        for (let q = 0; q < listTestVectors.length; q++) {
            testVectors = require(`./sources/${listTestVectors[q]}`);
            console.log(`   test vector name: ${listTestVectors[q]}`);
            for (let i = 0; i < testVectors.length; i++) {
                const output = {};
                let {
                    id,
                    genesis,
                    oldStateRoot,
                    txs,
                    newStateRoot,
                    sequencerAddress,
                    expectedNewLeafs,
                    oldBatchAccInputHash,
                    chainID,
                    forkID,
                    forcedHashData,
                    previousL1InfoTreeRoot,
                    previousL1InfoTreeIndex,
                    forcedData,
                } = testVectors[i];
                console.log(`Executing test-vector id: ${id}`);
                forcedData = {
                    globalExitRoot: '0x16994edfddddb9480667b64174fc00d3b6da7290d37b8db3a16571b4ddf0789f',
                    blockHashL1: '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
                    minTimestamp: '1944498031',
                };
                forcedHashData = l1InfoTreeUtils.getL1InfoTreeValue(
                    forcedData.globalExitRoot,
                    forcedData.blockHashL1,
                    forcedData.minTimestamp,
                );
                // init SMT Db
                const db = new zkcommonjs.MemDB(F);
                const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                    db,
                    poseidon,
                    [F.zero, F.zero, F.zero, F.zero],
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
                    oldStateRoot = zkcommonjs.smtUtils.h4toString(zkEVMDB.stateRoot);
                }
                expect(zkcommonjs.smtUtils.h4toString(zkEVMDB.stateRoot)).to.be.equal(oldStateRoot);

                const extraData = { forcedData, l1Info: {} };
                const batch = await zkEVMDB.buildBatch(
                    sequencerAddress,
                    2, // Type is 2 for forced transactions
                    forcedHashData,
                    oldBatchAccInputHash,
                    previousL1InfoTreeRoot,
                    previousL1InfoTreeIndex,
                    Constants.DEFAULT_MAX_TX,
                    {
                        vcmConfig: {
                            skipCounters: true,
                        },
                    },
                    extraData,
                );

                // TRANSACTIONS
                const txsList = [];
                let commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.Berlin });

                for (let j = 0; j < txs.length; j++) {
                    let isLegacy = false;
                    const currentTx = txs[j];
                    if (currentTx.type === 11) {
                        continue;
                    }
                    const isSigned = !!(currentTx.r && currentTx.v && currentTx.s);
                    const accountFrom = genesis.filter((x) => x.address.toLowerCase() === currentTx.from.toLowerCase())[0];
                    if (!accountFrom && !isSigned) {
                    // Ignore transaction
                        console.log('*******Tx Invalid --> Error: Invalid from address (tx ignored)');
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    // prepare tx
                    const txData = {
                        to: currentTx.to,
                        nonce: Number(currentTx.nonce),
                        value: new BN(currentTx.value),
                        data: currentTx.data,
                        gasLimit: new BN(currentTx.gasLimit),
                        gasPrice: new BN(currentTx.gasPrice),
                    };
                    if (typeof currentTx.chainId === 'undefined') {
                        isLegacy = true;
                        commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.TangerineWhistle });
                    } else {
                        txData.chainId = new BN(currentTx.chainId);
                    }
                    let tx;
                    if (isSigned) {
                        txData.s = new BN(currentTx.s.slice(2), 'hex');
                        txData.r = new BN(currentTx.r.slice(2), 'hex');
                        txData.v = new BN(currentTx.v.slice(2), 'hex');
                        tx = Transaction.fromTxData(txData, { common: commonCustom });
                    } else {
                        tx = Transaction.fromTxData(txData, { common: commonCustom }).sign(toBuffer(accountFrom.pvtKey));
                    }
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
                    const messageToHash = [
                        tx.nonce.toString(16),
                        tx.gasPrice.toString(16),
                        tx.gasLimit.toString(16),
                        to.toString(16),
                        tx.value.toString(16),
                        tx.data.toString('hex'),
                    ];
                    if (!isLegacy) {
                        messageToHash.push(
                            ethers.utils.hexlify(txChainId),
                            '0x',
                            '0x',
                        );
                    }
                    const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                    const signData = ethers.utils.RLP.encode(newMessageToHash);
                    const r = tx.r.toString(16).padStart(32 * 2, '0');
                    const s = tx.s.toString(16).padStart(32 * 2, '0');
                    const v = (sign + 27).toString(16).padStart(1 * 2, '0');
                    const effectivePercentage = tx.effectivePercentage ? tx.effectivePercentage.slice(2) : 'ff';
                    const calldata = signData.concat(r).concat(s).concat(v).concat(effectivePercentage);
                    txsList.push(calldata);
                    batch.addRawTx(calldata);
                }

                // Compare storage
                const res = await batch.executeTxs();

                if (evmDebug) {
                    try {
                        await generateEvmDebugFile(batch, `${file.split('.')[0]}-${i}.json`);
                    } catch (e) {
                        console.log(`Can't generate evm debug file: ${e}`);
                    }
                }

                await zkEVMDB.consolidate(batch);
                const circuitInput = await batch.getStarkInput();
                circuitInput.virtualCounters = res.virtualCounters;
                if (update) {
                    newStateRoot = zkcommonjs.smtUtils.h4toString(batch.currentStateRoot);
                }
                // Check new root
                expect(zkcommonjs.smtUtils.h4toString(batch.currentStateRoot)).to.be.equal(newStateRoot);

                // Check balances and nonces
                // eslint-disable-next-line no-restricted-syntax
                for (const [address] of Object.entries(expectedNewLeafs)) {
                    const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                    const storage = await zkEVMDB.dumpStorage(address);
                    const hashBytecode = await zkEVMDB.getHashBytecode(address);
                    const bytecodeLength = await zkEVMDB.getLength(address);
                    if (!update) {
                        expect(newLeaf.balance.toString()).to.equal(expectedNewLeafs[address].balance);
                        expect(newLeaf.nonce.toString()).to.equal(expectedNewLeafs[address].nonce);

                        expect(lodash.isEqual(storage, expectedNewLeafs[address].storage)).to.be.equal(true);
                    }
                    if (update) {
                        expectedNewLeafs[address] = {
                            balance: newLeaf.balance.toString(),
                            nonce: newLeaf.nonce.toString(),
                            hashBytecode,
                            storage,
                            bytecodeLength,
                        };
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
                circuitInput.genesis = genesis;
                circuitInput.expectedNewLeafs = expectedNewLeafs;
                // Save output in file
                const outPath = path.join(__dirname, `../../inputs-executor/special-inputs-ignore/forcedtx-inputs-ignore/${listTestVectors[q].replace('.json', '')}_${id}.json`);
                console.log(outPath);
                await fs.writeFileSync(outPath, JSON.stringify(circuitInput, null, 2));
                if (update) {
                    testVectors[i].batchL2Data = batch.getBatchL2Data();
                    testVectors[i].oldStateRoot = oldStateRoot;
                    testVectors[i].newStateRoot = newStateRoot;
                    testVectors[i].batchHashData = circuitInput.batchHashData;
                    testVectors[i].oldLocalExitRoot = circuitInput.oldLocalExitRoot;
                    testVectors[i].chainID = chainID;
                    testVectors[i].oldBatchAccInputHash = oldBatchAccInputHash;
                    testVectors[i].txs = txs;
                    testVectors[i].expectedNewLeafs = expectedNewLeafs;
                    testVectors[i].forkID = forkID;
                    testVectors[i].virtualCounters = res.virtualCounters;
                }
            }
            if (update) {
                await fs.writeFileSync(path.join(__dirname, `./sources/${listTestVectors[q]}`), JSON.stringify(testVectors, null, 2));
            }
        }
    });

    async function generateEvmDebugFile(batch, fileName) {
        // Create dir if not exists
        const dir = path.join(__dirname, '/evm-stack-logs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const txs = [];
        for (const txSteps of batch.evmSteps) {
            const { steps } = txSteps;
            if (steps) {
                const stepObjs = [];
                for (const step of steps) {
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
                txs.push({
                    steps: stepObjs,
                    counters: txSteps.counters,
                });
            }
        }
        const debugFile = {
            txs,
            counters: batch.vcm.getCurrentSpentCounters(),
        };
        fs.writeFileSync(path.join(dir, fileName), JSON.stringify(debugFile, null, 2));
    }
});
