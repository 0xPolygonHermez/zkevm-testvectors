/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const { Scalar } = require('ffjavascript');
const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const helpers = require('../../helpers/helpers');

const testvectorsGlobalConfig = require(path.join(__dirname, '../../../testvectors.config.json'));

// example: npx mocha gen-inputs.js --test xxxx --folder xxxx --ignore
describe('Generate inputs executor from ethereum tests GeneralStateTests\n\n', async function () {
    this.timeout(800000);
    let poseidon;
    let F;
    let outputName;
    let outputPath;
    let test;
    let file;
    let folder;
    let group;
    let evmDebug;
    let info = '';
    let infoErrors = '';
    let basePath = '../../../tools/ethereum-tests/tests/';
    let tests30M = [];
    let dir30M;
    // let allTests;
    let allTests = true;
    let counts = {};
    counts.countTests = 0;
    counts.countErrors = 0;
    counts.countOK = 0;
    counts.countNotSupport = 0;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('Load tests & generate inputs', async () => {
        const files = require('./test-eth-list.json');
        const keys = Object.keys(files);
        for (let x = 0; x < keys.length; x++) {
            file = basePath + files[keys[x]].path;
            // eslint-disable-next-line import/no-dynamic-require
            test = require(file);
            const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
            const currentTest = test[keysTests[files[keys[x]].index]];
            let accountPkFrom;
            if (currentTest._info.source.endsWith('.json')) {
                let source;
                try {
                    source = require(`${basePath}${currentTest._info.source}`);
                } catch (e) {
                    throw new Error('Error: ethereum/tests error');
                }
                accountPkFrom = source[(file.split('/')[file.split('/').length - 1]).split('.json')[0]].transaction.secretKey;
                accountPkFrom = accountPkFrom.startsWith('0x') ? accountPkFrom : `0x${accountPkFrom}`;
                accountPkFrom = toBuffer(accountPkFrom);
            } else if (currentTest._info.source.endsWith('.yml')) {
                let s;
                try {
                    s = fs.readFileSync(path.join(__dirname, `${basePath}${currentTest._info.source}`), 'utf8');
                } catch (e) {
                    throw new Error('Error: ethereum/tests error');
                }
                let indNum = s.search('secretKey:');
                while (s.substring(indNum, indNum + 1) !== ' ') {
                    indNum += 1;
                }
                indNum += 1;
                if (s.substring(indNum, indNum + 1) === '"' || s.substring(indNum, indNum + 1) === '\'') { indNum += 1; }
                if (s.substring(indNum, indNum + 2) === '0x') { indNum += 2; }
                accountPkFrom = toBuffer(`0x${s.substring(indNum, indNum + 64)}`);
            } else {
                throw new Error('Error info source (json or yml)');
            }

            const oldAccInputHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const { timestamp } = currentTest.blocks[0].blockHeader;
            const sequencerAddress = currentTest.blocks[0].blockHeader.coinbase;
            const chainIdSequencer = 1001;
            const globalExitRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
            const txsTest = currentTest.blocks[0].transactions;
            const { pre } = currentTest;

            const genesis = [];
            for (let i in pre) {
                const account = {
                    address: i,
                    nonce: Scalar.e(pre[i].nonce, 16).toString(),
                    balance: Scalar.e(pre[i].balance, 16).toString(),
                    storage: {},
                };
                for (let key in pre[i].storage) {
                    account.storage[`0x${key.slice(2).padStart(64, '0')}`] = pre[i].storage[key];
                }
                if (pre[i].code !== '0x') {
                    account.bytecode = pre[i].code.startsWith('0x') ? pre[i].code : `0x${pre[i].code}`;
                }
                genesis.push(account);
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
                chainIdSequencer,
                testvectorsGlobalConfig.forkID,
            );
            let options = {};
            const batch = await zkEVMDB.buildBatch(
                timestamp,
                sequencerAddress,
                zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                undefined,
                options,
            );

            for (let tx = 0; tx < txsTest.length; tx++) {
                const txTest = txsTest[tx];

                if (Scalar.gt(Scalar.e(txTest.gasLimit), Scalar.e('0x7FFFFFFF'))) {
                    txsTest[tx].gasLimit = '0x7FFFFFFF';
                } else if (Scalar.e(txTest.gasLimit) > zkcommonjs.Constants.BATCH_GAS_LIMIT && !options.newBatchGasLimit) {
                    txsTest[tx].gasLimit = zkcommonjs.Constants.BATCH_GAS_LIMIT;
                }

                const commonCustom = Common.custom({ chainId: chainIdSequencer }, { hardfork: Hardfork.Berlin });
                if (txTest.r) delete txTest.r;
                if (txTest.s) delete txTest.s;
                if (txTest.v) delete txTest.v;
                if (txTest.type === null) delete txTest.type;
                let txSigned = Transaction.fromTxData(txTest, { common: commonCustom }).sign(accountPkFrom);
                const sign = !(Number(txSigned.v) & 1);
                const chainId = (Number(txSigned.v) - 35) >> 1;
                const messageToHash = [
                    Scalar.e(txTest.nonce).toString(16),
                    Scalar.e(txTest.gasPrice).toString(16),
                    Scalar.e(txTest.gasLimit).toString(16),
                    txTest.to ? txTest.to : '',
                    Scalar.e(txTest.value).toString(16),
                    txTest.data,
                    ethers.utils.hexlify(chainId),
                    '0x',
                    '0x',
                ];

                const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                const signData = ethers.utils.RLP.encode(newMessageToHash);
                const rCalldata = txSigned.r.toString(16).padStart(32 * 2, '0');
                const sCalldata = txSigned.s.toString(16).padStart(32 * 2, '0');
                const vCalldata = (sign + 27).toString(16).padStart(1 * 2, '0');
                const effectivePercentage = txTest.effectivePercentage ? txTest.effectivePercentage.slice(2) : 'ff';
                const calldata = signData.concat(rCalldata).concat(sCalldata).concat(vCalldata).concat(effectivePercentage);

                batch.addRawTx(calldata);
            }

            await batch.executeTxs();
            await zkEVMDB.consolidate(batch);

            const { postState } = currentTest;

            if (postState) {
                const addresses = Object.keys(postState);
                for (let j = 0; j < addresses.length; j++) {
                    let address = addresses[j];
                    if (address !== sequencerAddress) {
                        const infoExpect = postState[address];
                        const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                        if (infoExpect.balance) {
                            expect(Scalar.e(newLeaf.balance).toString()).to.be.equal(Scalar.e(infoExpect.balance).toString());
                        }

                        if (infoExpect.nonce) {
                            expect(Scalar.e(newLeaf.nonce).toString()).to.be.equal(Scalar.e(infoExpect.nonce).toString());
                        }

                        if (infoExpect.code && infoExpect.code !== '0x') {
                            const bytecode = await zkEVMDB.getBytecode(address);
                            expect(`0x${bytecode}`).to.be.equal(infoExpect.code);
                        }

                        if (infoExpect.storage && Object.keys(infoExpect.storage).length > 0) {
                            if (address !== ethers.constants.AddressZero) {
                                const storage = await zkEVMDB.dumpStorage(address);
                                for (let elem in infoExpect.storage) {
                                    if (Scalar.e(infoExpect.storage[elem]) !== Scalar.e(0)) {
                                        expect(Scalar.e(infoExpect.storage[elem])).to.be.equal(Scalar.e(storage[`0x${elem.slice(2).padStart(64, '0')}`]));
                                    }
                                }
                            }
                        }
                    }
                }
            }
            const circuitInput = await batch.getStarkInput();
            Object.keys(circuitInput.contractsBytecode).forEach((key) => {
                if (!circuitInput.contractsBytecode[key].startsWith('0x')) {
                    circuitInput.contractsBytecode[key] = `0x${circuitInput.contractsBytecode[key]}`;
                }
            });
            for (let i = 0; i < genesis.length; i++) {
                const acc = genesis[i];
                if (acc.bytecode) {
                    const hashContract = await zkcommonjs.smtUtils.hashContractBytecode(acc.bytecode);
                    if (!circuitInput.contractsBytecode[hashContract]) {
                        circuitInput.contractsBytecode[hashContract] = acc.bytecode;
                    }
                }
            }
            console.log(`WRITE: ./inputs/${keys[x]}`);
            await fs.writeFileSync(`./inputs/eth-${keys[x]}`, JSON.stringify(circuitInput, null, 2));
        }
    });
});
