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
const helpers = require('../../tools-calldata/helpers/helpers');
const smMain = require('../../../zkevm-proverjs/src/sm/sm_main/sm_main');
const rom = require('../../../zkevm-rom/build/rom.json');
const configs = require('./benchmark_config.json');
const pilCache = require('../../../zkevm-proverjs/cache-main-pil.json');

let F;
let poseidon;
let zkEVMDB;

/** #########################################################
 *                            CONFIG
 * ######################################################### */
const CONFIG_ID = argv.config_id ? Number(argv.config_id) : 0; // Set config id here
const compilePil = false;
const config = configs[CONFIG_ID];
const {
    testPath, setupTxs, iterateTxs, testIndex, initStep, testStep,
} = config;
const testFilePath = path.join(__dirname, testPath);
const testObject = require(testFilePath)[testIndex];

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
    while (!errFound) {
        // Build genesis
        await buildGenesis();
        // Create batch with setup txs
        if (setupTxs.length > 0) {
            await createRawTxs(1, true);
        }
        // Create raw transactions
        const circuitInput = await createRawTxs(txCount, false);
        fs.writeFileSync(path.join(__dirname, `./inputs/${config.name}-${txCount}.json`), JSON.stringify(circuitInput, null, 2));
        const dataLen = circuitInput.batchL2Data.slice(2).length / 2;
        console.log('batchL2DataLen: ', dataLen);
        // Execute transactions
        console.log(`Execute with ${txCount} transactions`);
        await executeTx(circuitInput, cmPols);
        // Read tracer result
        errFound = await readTracer(txCount, dataLen);
        if (!errFound) {
            txCount += testStep;
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
    result.responses.forEach(function (res) {
        if (res.error !== '') {
            errFound = true;
            console.log(`Found error: ${res.error}`);
            config.benchmark.bottleneck = res.error;
        }
    });
    if (!errFound && config.benchmark.txs < txCount) {
        updateBenchmark(result, txCount, dataLen);
    }
    return errFound;
}

function updateBenchmark(result, txCount, dataLen) {
    config.benchmark = {
        txs: txCount,
        totalDataBytes: dataLen,
        cntArith: result.counters.cnt_arith,
        cntBinary: result.counters.cnt_binary,
        cntMemAlign: result.counters.cnt_mem_align,
        cntKeccak: result.counters.cnt_keccak_f,
        cntPadding: result.counters.cnt_padding_pg,
        cntPoseidon: result.counters.cnt_poseidon_g,
        cntSeps: result.counters.cont_steps,
        cumulativeGasUsed: result.cumulative_gas_used,
    };
}

function printTracerResults(result) {
    console.log(`
    arith: ${result.counters.cnt_arith}
    binary: ${result.counters.cnt_binary}
    memAlign: ${result.counters.cnt_mem_align}
    keccak: ${result.counters.cnt_keccak_f}
    padding: ${result.counters.cnt_padding_pg}
    poseidon: ${result.counters.cnt_poseidon_g}
    steps: ${result.counters.cont_steps}
    totalGas: ${result.cumulative_gas_used}
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
    const { genesis, oldAccInputHash, chainID } = testObject;

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
        txs, genesis, chainID, timestamp, sequencerAddress, globalExitRoot,
    } = testObject;

    const batch = await zkEVMDB.buildBatch(
        timestamp,
        sequencerAddress,
        zkcommonjs.smtUtils.stringToH4(globalExitRoot),
    );
    let finalTxs;
    if (!isSetup) {
        finalTxs = iterateTxs;
    } else {
        finalTxs = setupTxs;
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
            const calldata = signData.concat(r).concat(s).concat(v);
            batch.addRawTx(calldata);
        }
    }
    await batch.executeTxs();
    await zkEVMDB.consolidate(batch);
    const circuitInput = await batch.getStarkInput();
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
