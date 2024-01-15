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
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const paths = require('./paths.json');

const helpers = require(paths.helpers);

const testvectorsGlobalConfig = require(path.join(__dirname, paths['testvectors-config']));

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
    let info = '';
    let infoErrors = '';
    let basePath = `${paths['tests-ethereum']}/BlockchainTests`;
    // let allTests;
    let allTests = true;
    let countTests = 0;
    let countErrors = 0;
    let countOK = 0;
    let countNotSupport = 0;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('Load tests & generate inputs', async () => {
        if (argv.output) {
            outputPath = argv.output.trim();
        } else {
            outputPath = paths['output-ethereum-inputs'];
        }

        let dir = path.join(__dirname, outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        if (argv.group) {
            group = argv.group;
            outputPath += `/${argv.group.trim()}`;
            dir = path.join(__dirname, outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            if (argv.folder) {
                folder = argv.folder;
                outputPath += `/${group}/type0Txs`;
                dir = path.join(__dirname, outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }
        } else {
            group = 'GeneralStateTests';
            if (argv.folder) {
                folder = argv.folder;
                outputPath += `/${group}/type0Txs`;
                dir = path.join(__dirname, outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            } else if (argv.test) {
                const fileTest = `/${group}/${argv.test.trim()}`;
                outputPath += fileTest.replace(`/${fileTest.split('/')[fileTest.split('/').length - 1]}`, '');
                let auxOutputPath = '';
                for (let i = 0; i < outputPath.split('/').length; i++) {
                    auxOutputPath += `${outputPath.split('/')[i]}/`;
                    dir = path.join(__dirname, auxOutputPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                }
                file = fileTest;
            } else {
                file = 'all';
            }
        }
        let files = [];
        if (file === 'all') {
            const direc = fs.readdirSync(path.join(__dirname, basePath));
            for (let x = 0; x < direc.length; x++) {
                const path1 = `${basePath}/${direc[x]}`;
                const direc2 = fs.readdirSync(path.join(__dirname, path1));
                for (let x2 = 0; x2 < direc2.length; x2++) {
                    const path2 = `${path1}/${direc2[x2]}`;
                    const filesDirec = fs.readdirSync(path.join(__dirname, path2));
                    for (let y = 0; y < filesDirec.length; y++) {
                        const path3 = path.join(__dirname, `${path2}/${filesDirec[y]}`);
                        let stats = fs.statSync(path3);
                        if (stats.isFile()) {
                            files.push(path3);
                        } else {
                            const filesDirec2 = fs.readdirSync(path3);
                            for (let q = 0; q < filesDirec2.length; q++) {
                                files.push(`${path3}/${filesDirec2[q]}`);
                            }
                        }
                    }
                }
            }
            allTests = true;
        } else if (folder) {
            const pathFolder = path.join(__dirname, `${basePath}/${group}/${folder}`);
            const filesDirec = fs.readdirSync(pathFolder);
            for (let y = 0; y < filesDirec.length; y++) {
                let stats = fs.statSync(`${pathFolder}/${filesDirec[y]}`);
                if (stats.isFile()) {
                    files.push(`${pathFolder}/${filesDirec[y]}`);
                } else {
                    const filesDirec2 = fs.readdirSync(`${pathFolder}/${filesDirec[y]}`);
                    for (let q = 0; q < filesDirec2.length; q++) {
                        files.push(`${pathFolder}/${filesDirec[y]}/${filesDirec2[q]}`);
                    }
                }
            }
        } else if (!argv.test) {
            const pathGroup = `${basePath}/${group}`;
            const direc = fs.readdirSync(pathGroup);
            for (let x = 0; x < direc.length; x++) {
                const pathFolder = `${pathGroup}/${direc[x]}`;
                const filesDirec = fs.readdirSync(pathFolder);
                for (let y = 0; y < filesDirec.length; y++) {
                    let stats = fs.statSync(`${pathFolder}/${filesDirec[y]}`);
                    if (stats.isFile()) {
                        files.push(`${pathFolder}/${filesDirec[y]}`);
                    } else {
                        const filesDirec2 = fs.readdirSync(`${pathFolder}/${filesDirec[y]}`);
                        for (let q = 0; q < filesDirec2.length; q++) {
                            files.push(`${pathFolder}/${filesDirec[y]}/${filesDirec2[q]}`);
                        }
                    }
                }
            }
        } else {
            files = [path.join(__dirname, `${basePath}/${file}`)];
        }

        for (let x = 0; x < files.length; x++) {
            file = files[x];
            file = file.endsWith('.json') ? file : `${file}.json`;
            outputName = `${file.split('/')[file.split('/').length - 1]}`;
            // eslint-disable-next-line import/no-dynamic-require
            test = require(file);

            const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
            const txsLength = keysTests.length;
            if (txsLength === 0) {
                infoErrors += 'no Berlin keys\n';
                infoErrors += `${outputName}\n`;
                infoErrors += '--------------------------------------------------\n';
            } else {
                for (let y = 0; y < txsLength; y++) {
                    countTests += 1;
                    let newOutputName;
                    try {
                        if (txsLength > 1) newOutputName = `${outputName.split('.json')[0]}_${y}.json`;
                        else newOutputName = outputName;

                        console.log('Test name: ', newOutputName);

                        dir = path.join(__dirname, outputPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                        const auxOutputPathName = `${dir}/${newOutputName}`;

                        const noExec = require(paths['no-exec']);

                        const listBreaksComputation = [];
                        noExec['breaks-computation'].forEach((elem) => listBreaksComputation.push(elem.name));

                        for (let e = 0; e < listBreaksComputation.length; e++) {
                            if (auxOutputPathName.includes(listBreaksComputation[e])) {
                                throw new Error('breaks computation test');
                            }
                        }

                        const listNotSupported = [];
                        noExec['not-supported'].forEach((elem) => listNotSupported.push(elem.name));

                        for (let e = 0; e < listNotSupported.length; e++) {
                            const notSupportedFile = listNotSupported[e].split('/');
                            if (folder.includes(`${notSupportedFile[0]}`) && auxOutputPathName.includes(`${notSupportedFile[1]}.json`)) {
                                throw new Error('not supported');
                            }
                        }

                        const currentTest = test[keysTests[y]];

                        let accountPkFrom;
                        if (currentTest._info.source.endsWith('.json')) {
                            const source = require(`${paths['tests-ethereum']}/${currentTest._info.source}`);
                            accountPkFrom = source[(file.split('/')[file.split('/').length - 1]).split('.json')[0]].transaction.secretKey;
                            accountPkFrom = accountPkFrom.startsWith('0x') ? accountPkFrom : `0x${accountPkFrom}`;
                            accountPkFrom = toBuffer(accountPkFrom);
                        } else {
                            const s = fs.readFileSync(path.join(__dirname, `${paths['tests-ethereum']}/${currentTest._info.source}`), 'utf8');
                            let indNum = s.search('secretKey');
                            while (s.substring(indNum, indNum + 1) !== ' ') {
                                indNum += 1;
                            }
                            indNum += 1;
                            if (s.substring(indNum, indNum + 1) === '"' || s.substring(indNum, indNum + 1) === '\'') { indNum += 1; }
                            if (s.substring(indNum, indNum + 2) === '0x') { indNum += 2; }
                            accountPkFrom = toBuffer(`0x${s.substring(indNum, indNum + 64)}`);
                        }
                        const oldAccInputHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
                        const timestamp = Scalar.e(currentTest.blocks[0].blockHeader.timestamp, 16).toString();
                        const sequencerAddress = currentTest.blocks[0].blockHeader.coinbase;
                        const forcedBlockHashL1 = '0x0000000000000000000000000000000000000000000000000000000000000000';
                        const chainIdSequencer = 1000;
                        const l1InfoRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
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
                        const extraData = { l1Info: {} };
                        const options = {};
                        options.skipVerifyL1InfoRoot = true;
                        const batch = await zkEVMDB.buildBatch(
                            timestamp,
                            sequencerAddress,
                            zkcommonjs.smtUtils.stringToH4(l1InfoRoot),
                            forcedBlockHashL1,
                            Constants.DEFAULT_MAX_TX,
                            options,
                            extraData,
                        );

                        // Ethereum test to add by default a changeL2Block trnsaction
                        const txChangeL2Block = {
                            type: 11,
                            deltaTimestamp: timestamp,
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

                        // Start parsing transactions ethereum test vectors
                        for (let tx = 0; tx < txsTest.length; tx++) {
                            const txTest = txsTest[tx];
                            if (Scalar.e(txTest.gasLimit) > zkcommonjs.Constants.TX_GAS_LIMIT) {
                                txsTest[tx].gasLimit = zkcommonjs.Constants.TX_GAS_LIMIT;
                            }
                            const commonCustom = Common.custom({ chainId: chainIdSequencer }, { hardfork: Hardfork.TangerineWhistle });
                            if (txTest.r) delete txTest.r;
                            if (txTest.s) delete txTest.s;
                            if (txTest.v) delete txTest.v;
                            let txSigned = Transaction.fromTxData(txTest, { common: commonCustom }).sign(accountPkFrom);
                            const sign = !(Number(txSigned.v) & 1);
                            const messageToHash = [
                                Scalar.e(txTest.nonce).toString(16),
                                Scalar.e(txTest.gasPrice).toString(16),
                                Scalar.e(txTest.gasLimit).toString(16),
                                txTest.to ? txTest.to : '',
                                Scalar.e(txTest.value).toString(16),
                                txTest.data,
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
                        console.log(`WRITE: ${dir}/${newOutputName}\n`);
                        await fs.writeFileSync(`${dir}/${newOutputName}`, JSON.stringify(circuitInput, null, 2));
                        countOK += 1;
                    } catch (e) {
                        console.log(e);
                        console.log();
                        if (e.toString() === 'Error: not supported') {
                            countNotSupport += 1;
                        } else {
                            countErrors += 1;
                        }
                        infoErrors += `${e.toString()}\n`;
                        infoErrors += `${newOutputName}\n`;
                        infoErrors += '--------------------------------------------------\n';
                    }
                }
            }
        }
        if (infoErrors !== '') {
            dir = path.join(__dirname, outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            await fs.writeFileSync(`${dir}/errors.txt`, infoErrors);
        }
        if (allTests) {
            const lengthAllTests = files.length;
            info += `files: ${lengthAllTests}\n`;
            info += `tests: ${countTests}\n`;
            info += `inputs: ${countOK}\n`;
            info += `errors: ${countErrors}\n`;
            info += `not-supported: ${countNotSupport}\n`;
            dir = path.join(__dirname, outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            await fs.writeFileSync(`${dir}/info.txt`, info);
        }
    });
});
