/* eslint-disable no-continue */
/* eslint-disable guard-for-in */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */

const grpc = require('@grpc/grpc-js');
const path = require('path');

const calldataInputsDir = path.join(__dirname, '../../inputs-executor');

const EXECUTOR_PROTO_PATH = path.join(__dirname, '../../../zkevm-comms-protocol/proto/executor/v1/executor.proto');

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
const zkProverProto = grpc.loadPackageDefinition(executorPackageDefinition).executor.v1;
const { ExecutorService } = zkProverProto;
const fs = require('fs');

let totalTests = 0;
let executedTests = 0;
const failedTests = [];
const client = new ExecutorService('54.170.178.97:50071', grpc.credentials.createInsecure());
/**
 * Test that runs all the inputs in inputs_executor folder to the a deployed prover. It sends the tests concurrently
 */
// 54.170.178.97:50071
// localhost:50071
describe('runInputs', async function () {
    try {
        const folders = fs.readdirSync(calldataInputsDir);
        for (const folder of folders) {
            const folderPath = `${calldataInputsDir}/${folder}`;
            if (!fs.lstatSync(folderPath).isDirectory()) {
                continue;
            }
            const tests = fs.readdirSync(folderPath);
            totalTests += tests.length;
            runTests(tests, folder);
        }
    } catch (e) {
        console.log(e);
    }
});

/**
 * Sends all the tests to the executor in parallel
 * @param {String} tests List of tests to run
 * @param {Number} folder name of the folder of the tests
 */
async function runTests(tests, folder) {
    try {
        for (const test of tests) {
            const testPath = `${calldataInputsDir}/${folder}/${test}`;
            const jsInput = JSON.parse(fs.readFileSync(testPath));
            processBatch(jsInput, test);
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Sends input to proverC for execution
 * @param {Object} input proverjs json input
 * @param {Array} test name of the test file
 */
function processBatch(input, test) {
    if (!test.endsWith('.json')) {
        executedTests += 1;
        return;
    }
    // format js input to c input
    const cInput = formatInput(input);
    client.ProcessBatch(cInput, (error, res) => {
        try {
            if (error) throw error;
            executedTests += 1;
            checkResponse(input, res, test);
            if (executedTests >= totalTests) {
                console.log(`Failed tests: ${failedTests.join(', ')}`);
            }
        } catch (e) {
            console.log(e);
        }
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
    }
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
        update_merkle_tree: 1,
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
