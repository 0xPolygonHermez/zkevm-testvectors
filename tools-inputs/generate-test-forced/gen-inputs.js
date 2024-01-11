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
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');

const { argv } = require('yargs');
const helpers = require('../helpers/helpers');
const testvectorsGlobalConfig = require('../testvectors.config.json');

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
        listTestVectors = fs.readdirSync('./sources');
        listTestVectors = fs.readdirSync('./sources').filter((x) => !x.startsWith('eth-') && !x.startsWith('in-') && !x.startsWith('general'));
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
                    expectedOldRoot,
                    txs,
                    expectedNewRoot,
                    sequencerAddress,
                    expectedNewLeafs,
                    oldAccInputHash,
                    l1InfoRoot,
                    timestamp,
                    timestampLimit,
                    chainID,
                    forcedBlockHashL1,
                } = testVectors[i];
                console.log(`Executing test-vector id: ${id}`);

                // Adapts input
                if (typeof forcedBlockHashL1 === 'undefined') { forcedBlockHashL1 = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'; }
                if (!chainID) chainID = 1000;
                if (typeof oldAccInputHash === 'undefined') {
                    oldAccInputHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
                }
                if (typeof timestampLimit === 'undefined') {
                    timestampLimit = timestamp;
                }
                if (typeof l1InfoRoot === 'undefined') {
                    l1InfoRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
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
                    testvectorsGlobalConfig.forkID,
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

                const extraData = { l1Info: {} };
                const batch = await zkEVMDB.buildBatch(
                    Scalar.e(timestampLimit),
                    sequencerAddress,
                    zkcommonjs.smtUtils.stringToH4(l1InfoRoot),
                    forcedBlockHashL1,
                    Constants.DEFAULT_MAX_TX,
                    {
                        skipVerifyL1InfoRoot: true,
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
                // Add address sytem at expected new leafs
                expectedNewLeafs[Constants.ADDRESS_SYSTEM] = {};
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
                circuitInput.genesis = genesis;
                circuitInput.expectedNewLeafs = expectedNewLeafs;
                // Save outuput in file
                console.log(`WRITE: ./inputs/${listTestVectors[q].replace('.json', '')}_${id}.json`);
                await fs.writeFileSync(`./inputs/${listTestVectors[q].replace('.json', '')}_${id}.json`, JSON.stringify(circuitInput, null, 2));
                if (update) {
                    testVectors[i].batchL2Data = batch.getBatchL2Data();
                    testVectors[i].expectedOldRoot = expectedOldRoot;
                    testVectors[i].expectedNewRoot = expectedNewRoot;
                    testVectors[i].batchHashData = circuitInput.batchHashData;
                    testVectors[i].inputHash = circuitInput.inputHash;
                    testVectors[i].l1InfoRoot = circuitInput.l1InfoRoot;
                    testVectors[i].timestampLimit = circuitInput.timestampLimit;
                    testVectors[i].oldLocalExitRoot = circuitInput.oldLocalExitRoot;
                    testVectors[i].chainID = chainID;
                    testVectors[i].oldAccInputHash = oldAccInputHash;
                    testVectors[i].txs = txs;
                    testVectors[i].expectedNewLeafs = expectedNewLeafs;
                    testVectors[i].forkID = testvectorsGlobalConfig.forkID;

                    // delete old unused values
                    delete testVectors[i].globalExitRoot;
                    delete testVectors[i].timestamp;
                    delete testVectors[i].historicGERRoot;
                    delete testVectors[i].arity;
                    delete testVectors[i].chainIdSequencer;
                    delete testVectors[i].defaultChainId;
                }
            }
            if (update) {
                await fs.writeFileSync(path.join(__dirname, `./sources/${listTestVectors[q]}`), JSON.stringify(testVectors, null, 2));
            }
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
