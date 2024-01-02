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
const paths = require('./paths.json');

const helpers = require(paths.helpers);

const testvectorsGlobalConfig = require(paths['testvectors-config']);
// example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update --output

describe('Generate inputs executor from test-vectors', async function () {
    this.timeout(1000000);
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
        update = !!(argv.update);
        file = (argv.vectors) ? argv.vectors : 'txs-calldata.json';
        file = file.endsWith('.json') ? file : `${file}.json`;
        inputName = (argv.inputs) ? argv.inputs : (`${file.replace('.json', '_')}`);
        testVectorDataPath = `../data/calldata/${file}`;
        testVectors = require(testVectorDataPath);
        internalTestVectorsPath = `../tools-calldata/generate-test-vectors/gen-${file}`;
        internalTestVectors = require(internalTestVectorsPath);
        inputsPath = '../../inputs-executor/calldata/';

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
                l1InfoRoot,
                timestamp,
                timestampLimit,
                chainID,
                forcedBlockHashL1,
                autoChangeL2Block,
                skipVerifyL1InfoRoot,
                invalidBatch,
                additionalGenesisAccountsFactor,
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            // Adapts input
            if (typeof forcedBlockHashL1 === 'undefined') forcedBlockHashL1 = Constants.ZERO_BYTES32;
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

            // Add additionalGenesisAccountsFactor
            if (additionalGenesisAccountsFactor) {
                const additionalAccounts = 2 ** additionalGenesisAccountsFactor;
                console.log(`Adding 2**${additionalGenesisAccountsFactor} (${additionalAccounts}) additional txs at genesis`);
                for (let j = 1; j <= additionalAccounts; j++) {
                    genesis.push({
                        address: `0x${String(j).padStart(40, '0')}`,
                        balance: '100000',
                        nonce: '22',
                    });
                }
            }

            // init SMT DB
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
                    skipVerifyL1InfoRoot: (typeof skipVerifyL1InfoRoot === 'undefined' || skipVerifyL1InfoRoot !== false),
                },
                extraData,
            );

            // TRANSACTIONS
            let commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.Berlin });

            // If first tx is not TX_CHANGE_L2_BLOCK, add one by default
            const addChangeL2Block = typeof autoChangeL2Block === 'undefined' || autoChangeL2Block !== false;

            if (addChangeL2Block && txs.length > 0 && txs[0].type !== Constants.TX_CHANGE_L2_BLOCK) {
                const txChangeL2Block = {
                    type: 11,
                    deltaTimestamp: timestampLimit,
                    l1Info: {
                        globalExitRoot: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
                        blockHash: '0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb',
                        timestamp: '42',
                    },
                    indexL1InfoTree: 0,
                };
                internalTestVectors[i].txs.unshift(txChangeL2Block);
                txs.unshift(txChangeL2Block);
            }

            for (let j = 0; j < txs.length; j++) {
                let isLegacy = false;
                const currentTx = txs[j];

                // Check for TX_CHANGE_L2_BLOCK
                if (currentTx.type === Constants.TX_CHANGE_L2_BLOCK) {
                    const rawChangeL2BlockTx = zkcommonjs.processorUtils.serializeChangeL2Block(currentTx);
                    const customRawTx = `0x${rawChangeL2BlockTx}`;

                    // Append l1Info to l1Info object
                    extraData.l1Info[currentTx.indexL1InfoTree] = currentTx.l1Info;

                    batch.addRawTx(customRawTx);
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
                    commonCustom = Common.custom({ chainId: Number(txData.chainId) }, { hardfork: Hardfork.Berlin });
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
                const txChainId = txData.chainId;
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
                        txChainId.toString(16),
                        '0x',
                        '0x',
                    );
                }
                const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                const signData = ethers.utils.RLP.encode(newMessageToHash);
                const r = tx.r.toString(16).padStart(32 * 2, '0');
                const s = tx.s.toString(16).padStart(32 * 2, '0');
                const v = (sign + 27).toString(16).padStart(1 * 2, '0');
                const effectivePercentage = currentTx.effectivePercentage ? currentTx.effectivePercentage.slice(2) : 'ff';
                const calldata = signData.concat(r).concat(s).concat(v).concat(effectivePercentage);
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
                expectedNewRoot = zkcommonjs.smtUtils.h4toString(batch.currentStateRoot);
            }
            // Check new root
            expect(zkcommonjs.smtUtils.h4toString(batch.currentStateRoot)).to.be.equal(expectedNewRoot);

            // Check balances and nonces
            // eslint-disable-next-line no-restricted-syntax
            // Add address system at expected new leafs
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

                if (bytecodeLength > 0) {
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
            }

            if (Object.keys(output.contractsBytecode).length > 0) {
                circuitInput.contractsBytecode = output.contractsBytecode;
            }

            if (invalidBatch) {
                expectedNewRoot = expectedOldRoot;
                circuitInput.newStateRoot = expectedOldRoot;
                testVectors[i].invalidBatch = invalidBatch;
                internalTestVectors[i].invalidBatch = invalidBatch;
            }

            // Save output in file
            if (outputFlag) {
                const dir = path.join(__dirname, inputsPath);
                console.log(`WRITE OUTPUT: ${dir}${inputName}${id}.json`);
                await fs.writeFileSync(`${dir}${inputName}${id}.json`, JSON.stringify(circuitInput, null, 2));
            }
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
                internalTestVectors[i].batchL2Data = batch.getBatchL2Data();
                internalTestVectors[i].newLocalExitRoot = circuitInput.newLocalExitRoot;
                internalTestVectors[i].expectedOldRoot = expectedOldRoot;
                internalTestVectors[i].expectedNewRoot = expectedNewRoot;
                internalTestVectors[i].batchHashData = circuitInput.batchHashData;
                internalTestVectors[i].inputHash = circuitInput.inputHash;
                internalTestVectors[i].l1InfoRoot = circuitInput.l1InfoRoot;
                internalTestVectors[i].timestampLimit = circuitInput.timestampLimit;
                internalTestVectors[i].oldLocalExitRoot = circuitInput.oldLocalExitRoot;
                internalTestVectors[i].newLocalExitRoot = circuitInput.newLocalExitRoot;
                internalTestVectors[i].chainID = chainID;
                internalTestVectors[i].oldAccInputHash = oldAccInputHash;
                internalTestVectors[i].expectedNewLeafs = expectedNewLeafs;
                internalTestVectors[i].forkID = testvectorsGlobalConfig.forkID;
                testVectors[i].virtualCounters = res.virtualCounters;

                // delete old unused values
                delete testVectors[i].globalExitRoot;
                delete testVectors[i].timestamp;
                delete testVectors[i].historicGERRoot;
                delete testVectors[i].arity;
                delete testVectors[i].chainIdSequencer;
                delete testVectors[i].defaultChainId;

                delete internalTestVectors[i].globalExitRoot;
                delete internalTestVectors[i].timestamp;
                delete internalTestVectors[i].historicGERRoot;
                delete internalTestVectors[i].arity;
                delete internalTestVectors[i].chainIdSequencer;
                delete internalTestVectors[i].defaultChainId;
            }
            if (invalidBatch && argv.verify) {
                const dir = path.join(__dirname, inputsPath);
                await verifyInvalidBatch(`${dir}${inputName}${id}.json`, expectedNewRoot);
            }
        }
        if (update) {
            console.log(`WRITE UPDATE: ${testVectorDataPath}`);
            console.log(`WRITE UPDATE: ${internalTestVectorsPath}`);
            await fs.writeFileSync(path.join(__dirname, testVectorDataPath), JSON.stringify(testVectors, null, 2));
            await fs.writeFileSync(path.join(__dirname, internalTestVectorsPath), JSON.stringify(internalTestVectors, null, 2));
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
                            depth: step.depth,
                            opcode: {
                                name: step.opcode.name,
                                fee: step.opcode.fee,
                            },
                            gasLeft: Number(step.gasLeft),
                            gasRefund: Number(step.gasRefund),
                            memory,
                            stack: step.stack.map((v) => `0x${v.toString('hex')}`),
                            codeAddress: step.codeAddress.buf.reduce(
                                (previousValue, currentValue) => previousValue + currentValue,
                                '0x',
                            ),
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

    async function verifyInvalidBatch(inputPath, expectedNewRoot) {
        const pathProverJs = '../../../zkevm-proverjs-internal';
        const pathRom = '../../../zkevm-rom-internal';
        const { newCommitPolsArray, compile } = require('pilcom');
        const smMain = require(path.join(pathProverJs, '/src/sm/sm_main/sm_main'));
        const fileCachePil = path.join(pathProverJs, '/cache-main-pil.json');
        const rom = JSON.parse(fs.readFileSync(path.join(pathRom, 'build/rom.json'), 'utf8'));
        const buildPoseidon = require('@0xpolygonhermez/zkevm-commonjs').getPoseidon;
        const poseidon2 = await buildPoseidon();
        const Fr = poseidon2.F;
        let pil;
        if (fs.existsSync(fileCachePil) && !argv.pil) {
            pil = JSON.parse(await fs.promises.readFile(fileCachePil, 'utf8'));
        } else {
            const pilConfig = {
                defines: { N: 4096 },
                namespaces: ['Main', 'Global'],
                disableUnusedError: true,
            };
            const pilPath = path.join(pathProverJs, 'pil/main.pil');
            pil = await compile(Fr, pilPath, null, pilConfig);
            await fs.promises.writeFile(fileCachePil, `${JSON.stringify(pil, null, 1)}\n`, 'utf8');
        }
        const cmPols = newCommitPolsArray(pil);
        // config object --> execute proverjs
        const config = {
            debug: true,
            debugInfo: { inputName: inputPath },
            stepsN: 8388608,
            tracer: false,
            counters: false,
            stats: false,
            assertOutputs: true,
        };
        const input = JSON.parse(await fs.promises.readFile(inputPath, 'utf8'));
        try {
            const res = await smMain.execute(cmPols.Main, input, rom, config);
            let found = false;
            for (let i = 0; i < res.errors.length; i++) {
                if (res.errors[i].includes('OOC')) {
                    found = true;
                    break;
                }
            }
            expect(found).to.be.equal(true);
            expect(res.output.newStateRoot).to.be.equal(expectedNewRoot);
        } catch (e) {
            expect(true).to.be.equal(false);
        }
    }
});
