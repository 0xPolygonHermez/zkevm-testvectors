/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
/* eslint-disable no-unreachable-loop */
/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
/* eslint-disable no-continue */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-new */
const grpc = require('@grpc/grpc-js');
const path = require('path');
const { ethers } = require('ethers');
const { toHexStringRlp } = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;
const { getPoseidon } = require('@0xpolygonhermez/zkevm-commonjs');
const { Scalar } = require('ffjavascript');

const calldataInputsDir = path.join(__dirname, '../../inputs-executor');

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

const client = new ExecutorService('54.170.178.97:50071', grpc.credentials.createInsecure());
const dbClient = new StateDBService('54.170.178.97:50061', grpc.credentials.createInsecure());
let poseidon;
let F;
let folders = [];

/**
 * Test that runs all the inputs in inputs_executor folder to the a deployed prover.
 */
// 54.170.178.97:50071
// localhost:50071
describe('runInputs', async function () {
    try {
        poseidon = await getPoseidon();
        F = poseidon.F;
        folders = fs.readdirSync(calldataInputsDir);
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
        process.exit(0);
    }
    const folder = folders[pos];
    const folderPath = `${calldataInputsDir}/${folder}`;
    // if (!fs.lstatSync(folderPath).isDirectory()) {
    //     continue;
    // }
    const tests = fs.readdirSync(folderPath);
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
        }
        const test = tests[pos];
        const folder = folders[folderPos];
        const testPath = `${calldataInputsDir}/${folder}/${test}`;
        const jsInput = JSON.parse(fs.readFileSync(testPath));
        // Populate db with input bytecode
        checkBytecode(jsInput, tests, pos, folderPos, 0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
        console.log(e);
    }
}

function processBatch(input, tests, pos, folderPos) {
    // format js input to c input
    const cInput = formatInput(input);
    client.ProcessBatch(cInput, (error, res) => {
        if (error) throw error;
        try {
            checkResponse(input, res, tests[pos]);
            console.log(`${pos}/${tests.length}`);
            runTests(tests, pos + 1, folderPos);
        } catch (e) {
            console.log(e);
            process.exit(0);
        }
    });
}

function checkBytecode(input, tests, pos, folderPos, bcPos) {
    if (bcPos >= Object.keys(input.contractsBytecode).length) {
        processBatch(input, tests, pos, folderPos);
        return;
    }
    const hash = Object.keys(input.contractsBytecode)[bcPos];
    // Only process bytecodes not address - bcHash
    if (hash.length < 64) {
        checkBytecode(input, tests, pos, folderPos, bcPos + 1);
        return;
    }
    const key = scalar2fea4(F, Scalar.e(hash));
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

function scalar2fea4(Fr, s) {
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

function setBytecode(input, tests, pos, folderPos, bcPos) {
    const hash = Object.keys(input.contractsBytecode)[bcPos];
    const bytecode = input.contractsBytecode[hash].slice(2);
    const key = scalar2fea4(F, Scalar.e(hash));
    dbClient.SetProgram({ key, data: Buffer.from(bytecode, 'hex'), peresistent: 1 }, (error, res) => {
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
    console.log(test);
    if (input.newStateRoot !== `0x${res.new_state_root.toString('hex')}`) {
        console.log('\x1b[31m', `Root mismatch at test ${test}`);
        console.log(`${input.newStateRoot} /// 0x${res.new_state_root.toString('hex')}`);
    } else {
        console.log('\x1b[32m', `${test} passed`);
    }
    //process.exit(0);
    // expect(input.newStateRoot).to.equal(`0x${res.new_state_root.toString('hex')}`);
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
        tx_hash_to_generate_call_trace: Buffer.from('5318d04c587473e523da58df7f9bd7921ea3e7075332ac180e67844ce8cac33b', 'hex'),
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
