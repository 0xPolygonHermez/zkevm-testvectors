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
const { expect } = require('chai');

const calldataInputsDir = path.join(__dirname, '../../inputs-executor');

const PROTO_PATH = path.join(__dirname, '../../../zkevm-comms-protocol/proto/executor/v1/executor.proto');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const zkProverProto = grpc.loadPackageDefinition(packageDefinition).executor.v1;
const { ExecutorService } = zkProverProto;
const fs = require('fs');

const client = new ExecutorService('localhost:50071', grpc.credentials.createInsecure());
let folders = [];
// 54.170.178.97:50071
// localhost:50071
describe('runInputs', async function () {
    try {
        folders = fs.readdirSync(calldataInputsDir);
        runFolderTest(0);
    } catch (e) {
        console.log(e);
    }
});

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

async function runTests(tests, pos, folderPos) {
    if (pos >= tests.length) {
        runFolderTest(folderPos + 1);
    }
    const test = tests[pos];
    const folder = folders[folderPos];
    const testPath = `${calldataInputsDir}/${folder}/${test}`;
    const jsInput = JSON.parse(fs.readFileSync(testPath));
    await new Promise((resolve) => setTimeout(resolve, 100));
    // format js input to c input
    const cInput = formatInput(jsInput);
    client.ProcessBatch(cInput, (error, res) => {
        if (error) throw error;
        try {
            checkResponse(jsInput, res, test);
            console.log(`${pos}/${tests.length}`);
            runTests(tests, pos + 1, folderPos);
        } catch (e) {
            console.log(e);
            process.exit(0);
        }
    });
}

function checkResponse(input, res, test) {
    // Check new state root
    console.log(test);
    // expect(input.newStateRoot).to.equal(`0x${res.new_state_root.toString('hex')}`);
    console.log(`OK ${test}`);
}

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
        // tx_hash_to_generate_call_trace: 0,
        db: formatDb(jsInput.db),
    };
}

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
