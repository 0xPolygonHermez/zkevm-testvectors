/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
/* eslint-disable no-loop-func */
/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-dynamic-require */

const path = require('path');
const { argv } = require('yargs');
const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { Address, BN, toBuffer } = require('ethereumjs-util');
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { Transaction } = require('@ethereumjs/tx');
const { ethers } = require('ethers');
const { newCommitPolsArray, compile } = require('pilcom');
const fs = require('fs');
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const { Scalar } = require('ffjavascript');
const helpers = require('../../tools-inputs/helpers/helpers');
const smMain = require('../../../zkevm-proverjs/src/sm/sm_main/sm_main');
const rom = require('../../../zkevm-rom/build/rom.json');
const configs = require('./benchmark_config.json');
const pilCache = require('../../../zkevm-proverjs/cache-main-pil.json');

let F;
let poseidon;
let zkEVMDB;
let initialzkEVMDB;

/** #########################################################
 *                            CONFIG
 * ######################################################### */
const CONFIG_ID = typeof argv.config_id !== 'undefined' ? Number(argv.config_id) : 0; // Set config id here
const genInputs = argv.inputs;
const skipCounters = typeof argv.counters === 'undefined';
console.log('skipCounters:', skipCounters);
const compilePil = false;
const config = configs[CONFIG_ID];
const {
    testPath, setupTxs, iterateTxs, testIndex, initStep, testStep, additionalGenesisAccountsFactor,
} = config;
const testFilePath = path.join(__dirname, testPath);
const testObject = require(testFilePath)[testIndex];
let lastTestIsError = true;
const isVCountersMode = true;

async function main() {
    let errFound = false;
    let txCount = initStep;
    // Create inputs dir if not exists
    if (!fs.existsSync(path.join(__dirname, './inputs'))) {
        fs.mkdirSync(path.join(__dirname, './inputs'));
    }
    // Build poseidon and PIL
    const cmPols = await initBuild();
    console.log(`Starting config ${CONFIG_ID}`);
    console.log(`Generate inputs: ${genInputs}`);
    while (!errFound) {
        // Build genesis
        await buildGenesis();
        // Create batch with setup txs
        if (setupTxs.length > 0) {
            await createRawTxs(1, true);
        }
        console.log(`Run with ${txCount} transactions`);
        // Create raw transactions
        let circuitInput;
        try {
            circuitInput = await createRawTxs(txCount, false);
        } catch (e) {
            if (e.message.includes('Out of counters')) {
                console.log(e.message);
                errFound = true;
            } else {
                console.log(e);
                throw e;
            }
        }
        if (!errFound) {
            if (genInputs) {
                fs.writeFileSync(path.join(__dirname, `./inputs/${config.name}-${txCount}.json`), JSON.stringify(circuitInput, null, 2));
            }
            if (isVCountersMode) {
                console.log('Finish vcounters limit, check or generate input');
                process.exit(0);
            }
            const dataLen = circuitInput.batchL2Data.slice(2).length / 2;
            console.log('batchL2DataLen: ', dataLen);
            // Execute transactions
            await executeTx(circuitInput, cmPols);
            // Read tracer result
            errFound = await readTracer(txCount, dataLen);
        }
        if (!errFound) {
            txCount += testStep;
            lastTestIsError = false;
        } else if (lastTestIsError) {
            errFound = false;
            txCount -= testStep;
        }
    }
    fs.writeFileSync(path.join(__dirname, './benchmark_config.json'), JSON.stringify(configs, null, 2));
    console.log(`Total correct txs ${txCount - testStep}`);
    console.log('FINISH');
}

async function readTracer(txCount, dataLen) {
    const result = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../zkevm-proverjs/src/sm/sm_main/logs-full-trace/benchmark-trace__full_trace.json')));
    printTracerResults(result);
    let errFound = false;
    const { responses } = result.block_responses[0];
    responses.forEach(function (res) {
        if (res.error !== '') {
            errFound = true;
            console.log(`Found error: ${res.error}`);
            config.benchmark.bottleneck = res.error;
        }
    });
    if (!errFound && config.benchmark.txs < txCount) {
        updateBenchmark(result, txCount, dataLen);
        fs.writeFileSync(path.join(__dirname, './benchmark_config.json'), JSON.stringify(configs, null, 2));
    }
    return errFound;
}

function updateBenchmark(result, txCount, dataLen) {
    config.benchmark = {
        txs: txCount,
        totalDataBytes: dataLen,
        cntArith: result.cnt_arithmetics,
        cntBinary: result.cnt_binaries,
        cntMemAlign: result.cnt_mem_aligns,
        cntKeccak: result.cnt_keccak_hashes,
        cntPadding: result.cnt_poseidon_paddings,
        cntPoseidon: result.cnt_poseidon_hashes,
        cntSha256: result.cnt_sha256_hashes,
        cntSteps: result.cnt_steps,
        cumulativeGasUsed: result.gas_used,
        additionalGenesisAccountsFactor,
    };
}

function printTracerResults(result) {
    console.log(`
    arith: ${result.cnt_arithmetics}
    binary: ${result.cnt_binaries}
    memAlign: ${result.cnt_mem_aligns}
    keccak: ${result.cnt_keccak_hashes}
    padding: ${result.cnt_poseidon_paddings}
    poseidon: ${result.cnt_poseidon_hashes}
    sha256: ${result.cnt_sha256_hashes}
    steps: ${result.cnt_steps}
    totalGas: ${result.gas_used}
    `);
}
async function executeTx(circuitInput, cmPols) {
    const pilConfig = {
        debug: true,
        execute: true,
        debugInfo: {
            inputName: 'benchmark-trace',
        },
        stepsN: 8388608,
        tracer: true,
    };
    await smMain.execute(cmPols.Main, circuitInput, rom, pilConfig);
}

async function buildGenesis() {
    const {
        genesis, oldAccInputHash, chainID,
    } = testObject;
    let { forkID } = testObject;
    if (!forkID) {
        forkID = 1;
    }
    if (initialzkEVMDB) {
        zkEVMDB = Object.assign(Object.create(Object.getPrototypeOf(initialzkEVMDB)), initialzkEVMDB);
        zkEVMDB = new zkcommonjs.ZkEVMDB(
            Object.assign(Object.create(Object.getPrototypeOf(initialzkEVMDB.db)), initialzkEVMDB.db),
            0,
            initialzkEVMDB.stateRoot,
            initialzkEVMDB.accInputHash,
            initialzkEVMDB.localExitRoot,
            poseidon,
            initialzkEVMDB.vm.copy(),
            Object.assign(Object.create(Object.getPrototypeOf(initialzkEVMDB.smt)), initialzkEVMDB.smt),
            chainID,
            forkID,
        );
        return;
    }

    if (additionalGenesisAccountsFactor) {
        const additionalAccounts = 2 ** additionalGenesisAccountsFactor;
        console.log(`Adding 2**${additionalGenesisAccountsFactor} (${additionalAccounts}) additional txs at genesis`);
        for (let i = 1; i <= additionalAccounts; i++) {
            genesis.push({
                address: `0x${String(i).padStart(40, '0')}`,
                balance: '100000',
                nonce: '22',
            });
        }
    }
    // init SMT Db
    const db = new zkcommonjs.MemDB(F);
    zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
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
    initialzkEVMDB = Object.assign(Object.create(Object.getPrototypeOf(zkEVMDB)), zkEVMDB);

    initialzkEVMDB = new zkcommonjs.ZkEVMDB(
        Object.assign(Object.create(Object.getPrototypeOf(zkEVMDB.db)), zkEVMDB.db),
        0,
        zkEVMDB.stateRoot,
        zkEVMDB.accInputHash,
        zkEVMDB.localExitRoot,
        poseidon,
        zkEVMDB.vm.copy(),
        Object.assign(Object.create(Object.getPrototypeOf(zkEVMDB.smt)), zkEVMDB.smt),
        chainID,
    );
}

async function initBuild() {
    // build poseidon
    poseidon = await zkcommonjs.getPoseidon();
    F = poseidon.F;
    // compile PIL
    let pil = pilCache;
    if (compilePil) {
        const pilConfig = {
            namespaces: ['Main', 'Global'],
            disableUnusedError: true,
        };
        const pilPath = path.join(__dirname, '../../../zkevm-proverjs/pil/main.pil');
        pil = await compile(F, pilPath, null, pilConfig);
    }
    // build pil
    return newCommitPolsArray(pil);
}

async function createRawTxs(txCount, isSetup) {
    const {
        skipVerifyL1InfoRoot, l1InfoRoot, txs, genesis, chainID, timestampLimit, sequencerAddress,
    } = testObject;

    const extraData = { l1Info: {} };
    const batch = await zkEVMDB.buildBatch(
        Scalar.add(Scalar.e(timestampLimit), 1000),
        sequencerAddress,
        zkcommonjs.smtUtils.stringToH4(l1InfoRoot),
        Constants.ZERO_BYTES32,
        2200,
        {
            skipVerifyL1InfoRoot: (typeof skipVerifyL1InfoRoot === 'undefined' || skipVerifyL1InfoRoot !== false),
            vcmConfig: {
                steps: 16357785,
                // verbose: true,
            },
        },
        extraData,
    );
    let finalTxs;
    if (!isSetup) {
        finalTxs = iterateTxs;
    } else {
        finalTxs = setupTxs;
    }
    // process and remove changel2block tx
    if (txs[0].type === Constants.TX_CHANGE_L2_BLOCK) {
        txs[0].deltaTimestamp = 1;
        const rawChangeL2BlockTx = zkcommonjs.processorUtils.serializeChangeL2Block(txs[0]);
        const customRawTx = `0x${rawChangeL2BlockTx}`;

        // Append l1Info to l1Info object
        extraData.l1Info[txs[0].indexL1InfoTree] = txs[0].l1Info;

        batch.addRawTx(customRawTx);
    } else {
        const txChangeL2Block = {
            type: 11,
            deltaTimestamp: 1,
            l1Info: {
                globalExitRoot: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
                blockHash: '0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb',
                timestamp: '42',
            },
            indexL1InfoTree: 0,
        };
        const rawChangeL2BlockTx = zkcommonjs.processorUtils.serializeChangeL2Block(txChangeL2Block);
        const customRawTx = `0x${rawChangeL2BlockTx}`;
        batch.addRawTx(customRawTx);
    }
    for (let i = 0; i < txCount; i++) {
        for (const [j, index] of finalTxs.entries()) {
            const currentTx = txs[index];

            const accountFrom = genesis.filter((x) => x.address.toLowerCase() === currentTx.from.toLowerCase())[0];
            const acc = await zkEVMDB.vm.stateManager.getAccount(new Address(toBuffer(currentTx.from)));

            let nonce = i * finalTxs.length + j;
            if (isSetup) {
                nonce = currentTx.nonce;
            } else {
                nonce += Number(acc.nonce);
            }
            // prepare tx
            const txData = {
                to: currentTx.to,
                nonce: Number(nonce),
                value: new BN(currentTx.value),
                data: currentTx.data,
                gasLimit: new BN(currentTx.gasLimit),
                gasPrice: new BN(currentTx.gasPrice),
                chainId: new BN(currentTx.chainId),
            };
            const commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.Berlin });
            const tx = Transaction.fromTxData(txData, { common: commonCustom }).sign(toBuffer(accountFrom.pvtKey));

            const sign = !(Number(tx.v) & 1);
            const txChainId = (Number(tx.v) - 35) >> 1;
            const messageToHash = [
                tx.nonce.toString(16),
                tx.gasPrice.toString(16),
                tx.gasLimit.toString(16),
                tx.to.toString(16),
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
            if (typeof currentTx.effectivePercentage === 'undefined') {
                currentTx.effectivePercentage = '0xff';
            }
            const calldata = signData.concat(r).concat(s).concat(v).concat(currentTx.effectivePercentage.slice(2));
            batch.addRawTx(calldata);
        }
    }
    const vcounters = await batch.executeTxs();
    await generateEvmDebugFile(batch, 'asd.json');
    await zkEVMDB.consolidate(batch);
    const circuitInput = await batch.getStarkInput();
    circuitInput.virtualCounters = vcounters.virtualCounters;
    // append contracts bytecode
    for (let j = 0; j < genesis.length; j++) {
        const { bytecode } = genesis[j];
        if (bytecode) {
            const hashByteCode = await zkcommonjs.smtUtils.hashContractBytecode(bytecode);
            circuitInput.contractsBytecode[hashByteCode] = bytecode;
        }
    }
    return circuitInput;
}
main();

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
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(batch.vcm.consumptionReport, null, 2));
    // Join consumptions
    const cr = batch.vcm.consumptionReport;
    const nr = {};
    for (let i = 0; i < cr.length; i++) {
        const f = cr[i];
        if (typeof nr[f.function] === 'undefined') {
            nr[f.function] = {
                function: f.function,
                vcounters: f.vcounters,
            };
        } else {
            nr[f.function] = {
                function: f.function,
                vcounters: {
                    steps: nr[f.function].vcounters.steps + f.vcounters.steps,
                    arith: nr[f.function].vcounters.arith + f.vcounters.arith,
                    binary: nr[f.function].vcounters.binary + f.vcounters.binary,
                    memAlign: nr[f.function].vcounters.memAlign + f.vcounters.memAlign,
                    keccaks: nr[f.function].vcounters.keccaks + f.vcounters.keccaks,
                    padding: nr[f.function].vcounters.padding + f.vcounters.padding,
                    poseidon: nr[f.function].vcounters.poseidon + f.vcounters.poseidon,
                    sha256: nr[f.function].vcounters.sha256 + f.vcounters.sha256,
                },
            };
        }
    }
    fs.writeFileSync(path.join(dir, 'report2.json'), JSON.stringify(nr, null, 2));
}
