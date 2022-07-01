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

// example: npx mocha gen-inputs.js --test xxxx --folder xxxx --ignore
describe('Generate inputs executor from ethereum tests GeneralStateTests', async function () {
    this.timeout(30000);
    let poseidon;
    let F;
    let outputName;
    let outputPath;
    let testPath;
    let test;
    let file;
    let folder;
    let evmDebug;
    let info = '';
    let infoErrors = '';

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
        evmDebug = !!(argv['evm-debug']);
        let files = [];
        if (file === 'all') {
            const direc = fs.readdirSync('../tests/BlockchainTests/GeneralStateTests');
            for (let x = 0; x < direc.length; x++) {
                const filesDirec = fs.readdirSync(`../tests/BlockchainTests/GeneralStateTests/${direc[x]}`);
                for (let y = 0; y < filesDirec.length; y++) {
                    files.push(`${direc[x]}/${filesDirec[y]}`);
                }
            }
        } else if (folder) {
            const filesDirec = fs.readdirSync(`../tests/BlockchainTests/GeneralStateTests/${folder}`);
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
                || file.includes('createInitFailStackSizeLargerThan1024')
                || file.includes('LoopCallsDepthThenRevert')) {
                    throw new Error('error time');
                }
                file = file.endsWith('.json') ? file : `${file}.json`;

                outputPath = `./inputs/${file.substring(0, file.lastIndexOf('/'))}/`;
                outputName = `${file.split('/')[file.split('/').length - 1]}`;
                testPath = `../tests/BlockchainTests/GeneralStateTests/${file}`;
                // eslint-disable-next-line import/no-dynamic-require
                test = require(testPath);
                file = file.split('/')[file.split('/').length - 1];

                await hre.run('compile');
                console.log(`test vector name: ${file}`);
                const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
                const txsLength = keysTests.length;
                for (let y = 0; y < txsLength; y++) {
                    let newOutputName;
                    if (txsLength > 1) newOutputName = `${outputName.split('.json')[0]}_${y}.json`;
                    else newOutputName = outputName;
                    const currentTest = test[keysTests[y]];
                    const source = require(`../tests/${currentTest._info.source}`);
                    const accountPkFrom = toBuffer(`0x${source[file.split('.json')[0]].transaction.secretKey}`);
                    const oldLocalExitRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
                    const { timestamp } = currentTest.blocks[0].blockHeader;
                    const sequencerAddress = currentTest.blocks[0].blockHeader.coinbase;
                    const chainIdSequencer = 1000;
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
                        zkcommonjs.smtUtils.stringToH4(oldLocalExitRoot),
                        genesis,
                    );

                    const batch = await zkEVMDB.buildBatch(
                        timestamp,
                        sequencerAddress,
                        zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                    );

                    for (let tx = 0; tx < txsTest.length; tx++) {
                        const txTest = txsTest[tx];

                        if (Scalar.e(txTest.gasLimit) === Scalar.e('0x05f5e100')) {
                            // chainId tests
                            txTest.gasLimit = Math.trunc(txTest.gasLimit / 10);
                        } else if ((Scalar.e(txTest.gasLimit) >= Scalar.e('0x05f5e100'))) {
                            throw new Error('error gas');
                        }

                        const commonCustom = Common.custom({ chainId: chainIdSequencer }, { hardfork: Hardfork.Berlin });
                        let txSigned = Transaction.fromTxData(txTest, { common: commonCustom }).sign(accountPkFrom);
                        const sign = !(Number(txSigned.v) & 1);
                        const chainId = (Number(txSigned.v) - 35) >> 1;
                        const messageToHash = [
                            Scalar.e(txTest.nonce).toString(16),
                            Scalar.e(txTest.gasPrice).toString(16),
                            Scalar.e(txTest.gasLimit).toString(16),
                            txTest.to ? Scalar.e(txTest.to).toString(16) : '',
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
                        const calldata = signData.concat(rCalldata).concat(sCalldata).concat(vCalldata);

                        batch.addRawTx(calldata);
                    }

                    await batch.executeTxs();
                    if (evmDebug) {
                        await generateEvmDebugFile(batch.evmSteps, newOutputName);
                    }
                    await zkEVMDB.consolidate(batch);

                    const { postState } = currentTest;
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
                            if (infoExpect.storage && Object.keys(infoExpect.storage).length > 0) {
                                const storage = await zkEVMDB.dumpStorage(address);
                                for (let elem in infoExpect.storage) {
                                    if (Scalar.e(infoExpect.storage[elem]) !== Scalar.e(0)) {
                                        expect(Scalar.e(infoExpect.storage[elem])).to.be.equal(Scalar.e(storage[`0x${elem.slice(2).padStart(64, '0')}`]));
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
                    // if (argv.output) {
                    const dir = path.join(__dirname, outputPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    if (argv.ig) { newOutputName += '-ignore'; }
                    console.log(`WRITE: ${dir}${newOutputName}`);
                    await fs.writeFileSync(`${dir}${newOutputName}`, JSON.stringify(circuitInput, null, 2));
                    // }

                // if (argv.executor) {
                //     console.log('RUN EXECUTOR');
                // }
                }
            } catch (e) {
                if (e.toString().includes('yml')) {
                    info += `${chalk.red('Error file yml')}\n`;
                } else if (e.toString().includes('time')) {
                    info += `${chalk.red('Error time')}\n`;
                } else {
                    info += `${chalk.red('Error')}\n`;
                    info += `${chalk.red(e.toString())}\n`;
                }
                info += `${chalk.yellow(`${testPath}\n`)}`;
                infoErrors += `${e.toString()}\n`;
                infoErrors += `${testPath}\n`;
                infoErrors += '--------------------------------------------------\n';
            }
        }
        if (argv.folder) {
            if (infoErrors !== '') {
                const dir = path.join(__dirname, outputPath);
                await fs.writeFileSync(`${dir}/errors.txt`, infoErrors);
            }
        }
        console.log(info);
    });

    async function generateEvmDebugFile(evmTxSteps, fileName) {
        // Create dir if not exists
        const dir = path.join(__dirname, '/evm-stack-logs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const data = {};
        let txId = 0;
        for (const txSteps of evmTxSteps) {
            if (txSteps) {
                const stepObjs = [];
                for (const step of txSteps) {
                    if (step) {
                        // Format memory
                        let memory = step.memory.data.map((v) => v.toString(16)).join('').padStart(192, '0');
                        memory = memory.match(/.{1,32}/g); // split in 32 bytes slots
                        memory = memory.map((v) => `0x${v}`);

                        stepObjs.push({
                            pc: step.pc,
                            opcode: {
                                name: step.opcode.name,
                                fee: step.opcode.fee,
                            },
                            gasLeft: Number(`0x${step.gasLeft}`),
                            gasRefund: Number(`0x${step.gasRefund}`),
                            memory,
                            stack: step.stack.map((v) => `0x${v.toString('hex')}`),
                        });
                    }
                }
                data[txId] = stepObjs;
                txId += 1;
            }
        }
        fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2));
    }
});
