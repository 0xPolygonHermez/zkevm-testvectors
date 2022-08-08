/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
const path = require('path');
const fs = require('fs');
const VM = require('@polygon-hermez/vm').default;
const { Hardfork } = require('@ethereumjs/common');
const Common = require('@ethereumjs/common').default;
const { Scalar } = require('ffjavascript');
const { ethers } = require('ethers');

const common = Common.custom({ chainId: 1000 }, { hardfork: Hardfork.Berlin });
const {
    Address, Account, BN, toBuffer,
} = require('ethereumjs-util');
const {
    keyEthAddrBalance, keyEthAddrNonce, keyContractCode, keyContractLength, hashContractBytecode,
    keyContractStorage, h4toScalar, h4toString,
} = require('@0xpolygonhermez/zkevm-commonjs').smtUtils;
const {
    MemDB, getPoseidon, SMT, Constants,
} = require('@0xpolygonhermez/zkevm-commonjs');

// Dirs
const calldataInputsDir = path.join(__dirname, '../../inputs-executor');
const genTestsDir = path.join(__dirname, '../../state-transition/calldata');
const ethInputsDir = path.join(__dirname, '../../tools/ethereum-tests/eth-inputs/GeneralStateTests');
const ethStepsDir = path.join(__dirname, '../../tools/ethereum-tests/evm-stack-logs');
const fullTracerLogsDir = path.join(__dirname, '../../../zkevm-proverjs/src/sm/sm_main/logs-full-trace');
const outputDir = path.join(__dirname, '../../inputs-integration');
let poseidon;
let F;
/**
 * This script generates the necessary inputs for the node team to test different approaches. The data is obtanied from test-vectors inputs
 */
async function genInputs() {
    poseidon = await getPoseidon();
    F = poseidon.F;
    // Create inputs from calldata tests
    await generateFromCalldata();
}

/**
 * Generates an integration test from calldata test vectors
 */
async function generateFromCalldata() {
    const folders = fs.readdirSync(calldataInputsDir);
    for (const folder of folders) {
        const folderPath = `${calldataInputsDir}/${folder}`;
        if (!fs.lstatSync(folderPath).isDirectory()) {
            continue;
        }
        const tests = fs.readdirSync(folderPath);
        for (const test of tests) {
            const testPath = `${calldataInputsDir}/${folder}/${test}`;
            const jsonTest = JSON.parse(fs.readFileSync(testPath));
            formatStateTransition(jsonTest);
            // Find evm steps from test
            const steps = findFileinDir(fullTracerLogsDir, test.replace('.json', '__full_trace.json'));
            // Append steps
            jsonTest.traces = steps;
            // Append genesis raw
            const testId = test.split('_')[1].split('.')[0];
            const genTestFile = findFileinDir(genTestsDir, `${test.split('_')[0]}.json`)[testId];
            jsonTest.stateTransition = genTestFile;
            jsonTest.genesisRaw = await getGenesisRaw(genTestFile);
            // Write test
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }
            fs.writeFileSync(`${outputDir}/${test}`, JSON.stringify(jsonTest, null, 2));
        }
    }
}

/**
 * Format the state transition json for integration tests
 * @param {Object} json state transition test to format
 */
function formatStateTransition(json) {
    for (const hash of Object.keys(json.contractsBytecode)) {
        if (hash.length < 66) {
            delete json.contractsBytecode[hash];
        }
    }
}
/**
 * From the state transition test, gets the genesis and process it as its done at zkevm-db but storing the
 * keys, values and new state roots of each nre set on the smt
 * @param {String} testName the name of the test to search
 * @param {String} testId the id of the test
 * @returns {Object} json with the genesis in raw
 */
async function getGenesisRaw(genTestFile) {
    const genesisRaw = [];
    const newVm = new VM({ common });
    const db = new MemDB(F);
    const newSmt = new SMT(db, poseidon, poseidon.F);
    let SR = [F.zero, F.zero, F.zero, F.zero];
    for (let j = 0; j < genTestFile.genesis.length; j++) {
        const {
            address, nonce, balance, bytecode, storage,
        } = genTestFile.genesis[j];
        // Add contract account to EVM
        const addressInstance = new Address(toBuffer(address));
        const evmAccData = {
            nonce: new BN(nonce),
            balance: new BN(balance),
        };
        const evmAcc = Account.fromAccountData(evmAccData);
        await newVm.stateManager.putAccount(addressInstance, evmAcc);

        const keyBalance = await keyEthAddrBalance(address);
        const smtB = await newSmt.set(SR, keyBalance, Scalar.e(balance));
        genesisRaw.push(insertRawDb(address, Constants.SMT_KEY_BALANCE, null, keyBalance, smtB.newValue, smtB.newRoot));

        const keyNonce = await keyEthAddrNonce(address);
        const smtN = await newSmt.set(smtB.newRoot, keyNonce, Scalar.e(nonce));
        genesisRaw.push(insertRawDb(address, Constants.SMT_KEY_NONCE, null, keyNonce, smtN.newValue, smtN.newRoot));
        SR = smtN.newRoot;

        // Add bytecode and storage to EVM and SMT
        if (bytecode) {
            await newVm.stateManager.putContractCode(addressInstance, toBuffer(bytecode));
            const evmBytecode = await newVm.stateManager.getContractCode(addressInstance);
            const hexBytecode = `0x${evmBytecode.toString('hex')}`;

            let res;
            const hashByteCode = await hashContractBytecode(bytecode);
            let parsedBytecode = hexBytecode.startsWith('0x') ? hexBytecode.slice(2) : hexBytecode.slice();
            parsedBytecode = (parsedBytecode.length % 2) ? `0${parsedBytecode}` : parsedBytecode;

            const keyCC = await keyContractCode(address);
            res = await newSmt.set(SR, keyCC, Scalar.fromString(hashByteCode, 16));
            genesisRaw.push(insertRawDb(address, Constants.SMT_KEY_SC_CODE, null, keyCC, res.newValue, res.newRoot, bytecode));

            const keyCL = await keyContractLength(address);
            const bytecodeLength = parsedBytecode.length / 2;
            res = await newSmt.set(res.newRoot, keyCL, bytecodeLength);
            genesisRaw.push(insertRawDb(address, Constants.SMT_KEY_SC_LENGTH, null, keyCL, res.newValue, res.newRoot));
            SR = res.newRoot;
        }

        if (storage) {
            const skeys = Object.keys(storage).map((v) => toBuffer(v));
            const svalues = Object.values(storage).map((v) => toBuffer(v));

            for (let k = 0; k < skeys.length; k++) {
                await newVm.stateManager.putContractStorage(addressInstance, skeys[k], svalues[k]);
            }

            const sto = await newVm.stateManager.dumpStorage(addressInstance);
            const smtSto = {};

            const keys = Object.keys(sto).map((v) => `0x${v}`);
            const values = Object.values(sto).map((v) => `0x${v}`);
            for (let k = 0; k < keys.length; k++) {
                smtSto[keys[k]] = ethers.utils.RLP.decode(values[k]);
            }

            const storagePos = Object.keys(smtSto);
            for (let i = 0; i < storagePos.length; i++) {
                const pos = storagePos[i];
                const value = storage[pos];
                const keyStoragePos = await keyContractStorage(address, pos);
                const auxRes = await newSmt.set(SR, keyStoragePos, Scalar.e(value));
                genesisRaw.push(insertRawDb(
                    address,
                    Constants.SMT_KEY_SC_STORAGE,
                    pos,
                    keyStoragePos,
                    auxRes.newValue,
                    auxRes.newRoot,
                ));
                SR = auxRes.newRoot;
            }
        }
    }
    return genesisRaw;
}

/**
 * Inserts into the raw genesis object a new formated entry
 * @param {String} address of the account
 * @param {Number} type of smt insertion
 * @param {String} storagePosition position of the inserted storage in hex string
 * @param {Array} key h4 of the key to insert in smt
 * @param {BN} value to insert in the smt
 * @param {h4} newRoot the new root after the insertion in the smt
 */
function insertRawDb(address, type, storagePosition, key, value, newRoot, bytecode) {
    const step = {
        address,
        type,
        storagePosition,
        key: h4toScalar(key).toString(),
        value: value.toString(),
        root: h4toString(newRoot),
        bytecode,
    };
    return step;
}

/**
 * Small script to fins a file in a dir (just checks on level)
 * @param {String} searchDir dir where to look for
 * @param {String} fileName file to find
 * @returns {String} content of the found file or null
 */
function findFileinDir(searchDir, fileName) {
    const files = fs.readdirSync(searchDir);
    for (const file of files) {
        if (file === fileName) {
            return JSON.parse(fs.readFileSync(`${searchDir}/${file}`));
        }
    }
    return null;
}

// Start execution
genInputs();
