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
const { BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');
const { Scalar } = require('ffjavascript');
const zkcommonjs = require('@polygon-hermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const helpers = require('../../../tools-calldata/helpers/helpers');

// example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update --output

describe('Generate inputs executor from ethereum tests GeneralStateTests', async function () {
    this.timeout(8000);
    let poseidon;
    let F;
    let outputName;
    let outputPath;
    let testPath;
    let sourcePath;
    let test;
    let source;
    let file;
    let folder;
    let info = '';

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('Load tests & generate inputs', async () => {
        if (argv.folder) {
            folder = argv.folder;
        } else {
            file = (argv.test) ? argv.test : 'all';
        }
        let files = [];
        if (file === 'all') {
            const direc = fs.readdirSync('../tests/GeneralStateTests');
            for (let x = 0; x < direc.length; x++) {
                const filesDirec = fs.readdirSync(`../tests/GeneralStateTests/${direc[x]}`);
                for (let y = 0; y < filesDirec.length; y++) {
                    files.push(`${direc[x]}/${filesDirec[y]}`);
                }
            }
        } else if (folder) {
            const filesDirec = fs.readdirSync(`../tests/GeneralStateTests/${folder}`);
            for (let y = 0; y < filesDirec.length; y++) {
                files.push(`${folder}/${filesDirec[y]}`);
            }
        } else {
            files = [file];
        }
        for (let x = 0; x < files.length; x++) {
            try {
                file = files[x];
                if (file.includes('RECURSIVE')
                || file.includes('Spam')
                || file.includes('1024OOG')
                || file.includes('CallcodeLoseGasOOG')
                || file.includes('createInitFailStackSizeLargerThan1024')) {
                    throw new Error('error');
                }
                file = file.endsWith('.json') ? file : `${file}.json`;

                outputPath = `./inputs/${file.substring(0, file.lastIndexOf('/'))}/`;
                outputName = `${file.split('/')[file.split('/').length - 1]}`;
                testPath = `../tests/GeneralStateTests/${file}`;
                // eslint-disable-next-line import/no-dynamic-require
                test = require(testPath);
                file = file.split('/')[file.split('/').length - 1];
                sourcePath = `../tests/${test[file.split('.json')[0]]._info.source}`;
                source = require(sourcePath);
                await hre.run('compile');
                console.log(`test vector name: ${file}`);

                const oldLocalExitRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
                const timestamp = 1944498031;
                const sequencerAddress = '0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D';
                const chainIdSequencer = 1001;
                const globalExitRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
                const txTest = test[file.split('.json')[0]].transaction;
                const { pre } = test[file.split('.json')[0]];
                const { sender, secretKey } = txTest;
                const genesis = [];
                for (let i in pre) {
                    const account = {
                        address: i,
                        nonce: Scalar.e(pre[i].nonce, 16).toString(),
                        balance: Scalar.e(pre[i].balance, 16).toString(),
                        storage: {},
                    };
                    if (i === sender) {
                        account.pvtKey = secretKey;
                    }
                    for (let key in pre[i].storage) {
                        account.storage[`0x${key.slice(2).padStart(64, '0')}`] = pre[i].storage[key];
                    }
                    if (pre[i].code !== '0x') { account.bytecode = pre[i].code; }
                    genesis.push(account);
                }

                // init SMT Db
                const db = new zkcommonjs.MemDB(F);
                const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                    db,
                    poseidon,
                    [F.zero, F.zero, F.zero, F.zero],
                    zkcommonjs.smtUtils.stringToH4(oldLocalExitRoot),
                    genesis,
                );

                const batch = await zkEVMDB.buildBatch(
                    timestamp,
                    sequencerAddress,
                    chainIdSequencer,
                    zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                );

                const accountPkFrom = toBuffer(secretKey);
                const txData = {
                    nonce: txTest.nonce,
                    gasPrice: txTest.gasPrice,
                    gasLimit: txTest.gasLimit[0],
                    to: txTest.to,
                    value: txTest.value[0],
                    data: txTest.data[0],
                    chainId: chainIdSequencer,
                };

                if (Scalar.e(txData.gasLimit) >= Scalar.e('0x05f5e100')) {
                    txData.gasLimit = Math.trunc(txData.gasLimit / 10);
                }

                const commonCustom = Common.custom({ chainId: chainIdSequencer }, { hardfork: Hardfork.Berlin });

                let txSigned = Transaction.fromTxData(txData, { common: commonCustom }).sign(accountPkFrom);
                const sign = !(Number(txSigned.v) & 1);
                const chainId = (Number(txSigned.v) - 35) >> 1;
                const messageToHash = [
                    txSigned.nonce.toString(16),
                    txSigned.gasPrice.toString(16),
                    txSigned.gasLimit.toString(16),
                    txSigned.to ? txSigned.to.toString(16) : '',
                    txSigned.value.toString(16),
                    txSigned.data.toString('hex'),
                    ethers.utils.hexlify(chainId),
                    '0x',
                    '0x',
                ];

                const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                const signData = ethers.utils.RLP.encode(newMessageToHash);
                const rCalldata = txSigned.r.toString(16).padStart(32 * 2, '0');
                const sCalldata = txSigned.s.toString(16).padStart(32 * 2, '0');
                const vCalldata = (sign + 27).toString(16).padStart(1 * 2, '0');
                const calldata = signData.concat(rCalldata).concat(sCalldata).concat(vCalldata);
                batch.addRawTx(calldata);
                await batch.executeTxs();
                await zkEVMDB.consolidate(batch);

                const sourceExpect = source[file.split('.json')[0]].expect;
                for (let i = 0; i < sourceExpect.length; i++) {
                    const { result } = sourceExpect[i];
                    const addresses = Object.keys(result);
                    for (let j = 0; j < addresses.length; j++) {
                        let address = addresses[j];
                        const infoExpect = result[address];
                        const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                        if (infoExpect.balance) {
                            expect(Scalar.e(newLeaf.balance).toString()).to.be.equal(Scalar.e(infoExpect.balance).toString());
                        }
                        if (infoExpect.nonce) {
                            expect(Scalar.e(newLeaf.nonce).toString()).to.be.equal(Scalar.e(infoExpect.nonce).toString());
                        }
                        if (infoExpect.storage && Object.keys(infoExpect.storage).length > 0) {
                            const storage = await zkEVMDB.dumpStorage(address);
                            // console.log(infoExpect.storage);
                            // console.log(storage);
                            // TODO: expect
                        }
                    }
                }

                const circuitInput = await batch.getStarkInput();
                const dir = path.join(__dirname, outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                await fs.writeFileSync(`${dir}${outputName}`, JSON.stringify(circuitInput, null, 2));

                // if (argv.executor) {
                //     console.log('RUN EXECUTOR');
                // }
            } catch (e) {
                info += `${chalk.red('Error')}\n`;
                info += `${chalk.yellow(`${testPath}\n`)}`;
            }
        }
        console.log(info);
    });
});
