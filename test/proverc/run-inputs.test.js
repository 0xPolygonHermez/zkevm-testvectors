/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */

const grpc = require('@grpc/grpc-js');
const path = require('path');
const { ethers } = require('ethers');
const { toHexStringRlp } = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;
const { Scalar } = require('ffjavascript');

const calldataInputsDir = path.join(__dirname, '../../inputs-executor');
const ethTestsDir = path.join(__dirname, '../../tools/ethereum-tests/GeneralStateTests');
const EXECUTOR_PROTO_PATH = path.join(__dirname, '../../../zkevm-comms-protocol/proto/executor/v1/executor.proto');
const DB_PROTO_PATH = path.join(__dirname, '../../../zkevm-comms-protocol/proto/statedb/v1/statedb.proto');

const protoLoader = require('@grpc/proto-loader');

const executorPackageDefinition = protoLoader.loadSync(
    EXECUTOR_PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const dbPackageDefinition = protoLoader.loadSync(
    DB_PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const zkProverProto = grpc.loadPackageDefinition(executorPackageDefinition).executor.v1;
const stateDbProto = grpc.loadPackageDefinition(dbPackageDefinition).statedb.v1;
const { ExecutorService } = zkProverProto;
const { StateDBService } = stateDbProto;
const fs = require('fs');
const codes = require('./opcodes');

const client = new ExecutorService('51.210.116.237:50071', grpc.credentials.createInsecure());
const dbClient = new StateDBService('51.210.116.237:50061', grpc.credentials.createInsecure());
let folders = [];
const passedTests = [];
const failedTests = [];
const cancelledTests = [];
const insertBytecode = false;
/**
 * Test that runs all the inputs in inputs_executor folder to the a deployed prover.
 */
// 54.170.178.97:50071
// localhost:50071
describe('runInputs', async function () {
    try {
        folders = fs.readdirSync(ethTestsDir).map((i) => `${ethTestsDir}/${i}`);
        folders = folders.concat(fs.readdirSync(calldataInputsDir).map((i) => `${calldataInputsDir}/${i}`));
        runFolderTest(0);
    } catch (e) {
        console.log(e);
    }
});

/**
 * Runs the tests in a folder sequentially
 * @param {Number} pos index of the current folder
 */
function runFolderTest(pos) {
    if (pos >= folders.length) {
        console.log(`Total passed tests: ${passedTests.length}/${passedTests.length + failedTests.length}`);
        console.log(`Failed Tests: ${failedTests.toString()}`);
        console.log(`Cancelled Tests: ${cancelledTests.toString()}`);
        process.exit(0);
    }
    // if (!fs.lstatSync(folderPath).isDirectory()) {
    //     continue;
    // }
    const tests = fs.readdirSync(folders[pos]).map((i) => `${folders[pos]}/${i}`);
    runTests(tests, 0, pos);
}

/**
 * Sends a single input test to the prover. After the execution, it sequantially
 * runs the next test or tries to reun tests of the following folder
 * @param {String} tests name of the test
 * @param {Number} pos index of the test in the folder
 * @param {Number} folderPos index of the folder
 */
async function runTests(tests, pos, folderPos) {
    try {
        if (pos >= tests.length) {
            runFolderTest(folderPos + 1);
            return;
        }
        if (!tests[pos].endsWith('.json')) {
            runTests(tests, pos + 1, folderPos);
            return;
        }
        const jsInput = JSON.parse(fs.readFileSync(tests[pos]));
        // Populate db with input bytecode
        checkBytecode(jsInput, tests, pos, folderPos, 0);
    } catch (e) {
        console.log(e);
    }
}

/**
 * Sends input to proverC for execution
 * @param {Object} input proverjs json input
 * @param {Array} tests array of tests to run
 * @param {Number} pos position of the current test in the array of tests
 * @param {Number} folderPos position of the current test folder in the array of tests folders
 */
function processBatch(input, tests, pos, folderPos) {
    if (!tests[pos].endsWith('.json')) {
        runTests(tests, pos + 1, folderPos);
        return;
    }
    // format js input to c input
    const cInput = formatInput(input);
    client.ProcessBatch(cInput, (error, res) => {
        try {
            if (error) throw error;
            checkResponse(input, res, tests[pos]);
            console.log(`${pos}/${tests.length}`);
            runTests(tests, pos + 1, folderPos);
            // const tx_hash = res.responses[0].tx_hash.toString('hex');
            // const formatedSteps = formatSteps(res.responses[0].call_trace.steps);
            return;
        } catch (e) {
            cancelledTests.push(tests[pos]);
            console.log(e);
            runTests(tests, pos + 1, folderPos);
        }
    });
}

/**
 * Formats the returned array of steps from the proverC to a json compatible array
 * @param {Array} steps array
 * @returns {Array} array of formated steps
 */
function formatSteps(steps) {
    const res = [];
    for (const step of steps) {
        res.push({
            depth: step.depth,
            error: step.error,
            gas: step.gas,
            gas_cost: step.gas_cost,
            gas_refund: step.gas_refund,
            memory: step.memory.toString('hex'),
            op: codes[step.op].slice(2),
            pc: step.pc,
            return_data: step.return_data.toString('hex'),
            stack: step.stack,
            state_root: step.state_root.toString('hex'),
            contract: {
                address: step.contract.address,
                caller: step.contract.caller,
                data: step.contract.data.toString('hex'),
                gas: step.contract.gas,
                value: step.contract.value,
            },
        });
    }
    return res;
}

/**
 * Checks if the contracts bytecode is stored in the prover db, in case not, inserts it
 * @param {Object} input proverjs json input
 * @param {Array} tests array of tests to run
 * @param {Number} pos position of the current test in the array of tests
 * @param {Number} folderPos position of the current test folder in the array of tests folders
 * @param {Number} bcPos position of the bytecode in the contracts bytecode map
 */
function checkBytecode(input, tests, pos, folderPos, bcPos) {
    if (bcPos >= Object.keys(input.contractsBytecode).length || !insertBytecode) {
        processBatch(input, tests, pos, folderPos);
        return;
    }
    const hash = Object.keys(input.contractsBytecode)[bcPos];
    // Only process bytecodes not address - bcHash
    if (hash.length < 64) {
        checkBytecode(input, tests, pos, folderPos, bcPos + 1);
        return;
    }
    const key = scalar2fea4(Scalar.e(hash));
    dbClient.GetProgram({ key }, (error, res) => {
        if (error) {
            console.log(error);
            setBytecode(input.contractsBytecode, pos);
            throw error;
        }
        if (res.result.code === 'CODE_DB_KEY_NOT_FOUND') {
            setBytecode(input, tests, pos, folderPos, bcPos);
        } else {
            checkBytecode(input, tests, pos, folderPos, bcPos + 1);
        }
    });
}

/**
 * Converts a Scalar to a 4 field element array but with the values as Strings, for proverC protocol compatibility
 * @param {Scalar} s scalar to transform
 * @returns {Fea} scalar transformed to fea
 */
function scalar2fea4(s) {
    const r = [];

    r.push(Scalar.band(s, Scalar.e('0xFFFFFFFFFFFFFFFF')));
    r.push(Scalar.band(Scalar.shr(s, 64), Scalar.e('0xFFFFFFFFFFFFFFFF')));
    r.push(Scalar.band(Scalar.shr(s, 128), Scalar.e('0xFFFFFFFFFFFFFFFF')));
    r.push(Scalar.band(Scalar.shr(s, 192), Scalar.e('0xFFFFFFFFFFFFFFFF')));

    return {
        fe0: String(r[0]),
        fe1: String(r[1]),
        fe2: String(r[2]),
        fe3: String(r[3]),
    };
}

/**
 * Insert bytecode of the contrtact in the proverC database
 * @param {Object} input proverjs json input
 * @param {Array} tests array of tests to run
 * @param {Number} pos position of the current test in the array of tests
 * @param {Number} folderPos position of the current test folder in the array of tests folders
 * @param {Number} bcPos position of the bytecode in the contracts bytecode map
 */
function setBytecode(input, tests, pos, folderPos, bcPos) {
    const hash = Object.keys(input.contractsBytecode)[bcPos];
    const bytecode = input.contractsBytecode[hash].slice(2);
    const key = scalar2fea4(Scalar.e(hash));
    dbClient.SetProgram({ key, data: Buffer.from(bytecode, 'hex'), persistent: 1 }, (error, res) => {
        if (error) {
            console.log(error);
            throw error;
        }
        console.log(res);
        checkBytecode(input, tests, pos, folderPos, bcPos + 1);
    });
}

/**
 * Checks the response of the prover with the expected values
 * @param {Object} input the input object sent
 * @param {Object} res the ouput object received
 * @param {String} test name of the test
 */
function checkResponse(input, res, test) {
    // Check new state root
    if (input.newStateRoot !== `0x${res.new_state_root.toString('hex')}`) {
        console.log('\x1b[31m', `Root mismatch at test ${test}`);
        console.log(`${input.newStateRoot} /// 0x${res.new_state_root.toString('hex')}`);
        failedTests.push(test);
    } else {
        console.log('\x1b[32m', `${test} passed`);
        passedTests.push(test);
    }
    // process.exit(0);
}

/**
 * Formats the proverjs input to be proverc compatible
 * @param {Object} jsInput porverjs input
 * @returns {Object} proverc formated input
 */
function formatInput(jsInput) {
    return {
        batch_num: jsInput.numBatch,
        coinbase: jsInput.sequencerAddr,
        batch_l2_data: Buffer.from(jsInput.batchL2Data.slice(2), 'hex'),
        old_state_root: Buffer.from(jsInput.oldStateRoot.slice(2), 'hex'),
        global_exit_root: Buffer.from(jsInput.globalExitRoot.slice(2), 'hex'),
        old_local_exit_root: Buffer.from(jsInput.oldLocalExitRoot.slice(2), 'hex'),
        eth_timestamp: jsInput.timestamp,
        // update_merkle_tree: 1,
        // tx_hash_to_generate_execute_trace: 0,
        // tx_hash_to_generate_call_trace: Buffer.from('dde0848d8b85493472c4aa1b8414b4289409ed88047353e96b275a96e49efde6', 'hex'),
        db: formatDb(jsInput.db),
        contracts_bytecode: jsInput.contractsBytecode,
    };
}

/**
 * Formats the proverjs db input to be proverc compatible
 * @param {Object} jsDb proverjs db input
 * @returns {Object} proverc db input
 */
function formatDb(jsDb) {
    const cDb = {};
    for (const key of Object.keys(jsDb)) {
        const concat = jsDb[key].join('');
        cDb[key.slice(2)] = concat.padEnd(192, '0');
    }
    return cDb;
}
/**
 * Compute transaction hash from a transaction RLP enconding and hashing with keccak
 * @param {String} to - hex string
 * @param {Number} value - int number
 * @param {Number} nonce - int number
 * @param {String} gasLimit - hex string
 * @param {String} gasPrice - hex string
 * @param {String} data - hex string of the data
 * @param {String} r - hex string of r signature
 * @param {String} s - hex string of s signature
 * @param {String} v - hex string of v signature with EIP-155 applied (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md)
 * @returns {String} - Hex string with the transaction hash
 */
function getTransactionHash(to, value, nonce, gasLimit, gasPrice, data, r, s, v) {
    const txu = {
        value: toHexStringRlp(value),
        nonce: toHexStringRlp(nonce),
        gasLimit: toHexStringRlp(gasLimit),
        gasPrice: toHexStringRlp(gasPrice),
        data: toHexStringRlp(data),
        to: toHexStringRlp(to),
    };

    const sig = {
        r: toHexStringRlp(r),
        s: toHexStringRlp(s),
        v: toHexStringRlp(v),
    };

    const fields = [txu.nonce, txu.gasPrice, txu.gasLimit, txu.to, txu.value, txu.data, sig.v, sig.r, sig.s];
    const rlp = ethers.utils.RLP.encode(fields);
    const kecc = ethers.utils.keccak256(rlp);
    return kecc;
}
