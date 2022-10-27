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
const helpers = require('../../tools-calldata/helpers/helpers');

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
    let basePath = './tests/BlockchainTests';
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
            outputPath = '';
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
                outputPath += `/${argv.folder.trim()}-legacy`;
                dir = path.join(__dirname, outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }
        } else {
            group = 'GeneralStateTests';
            if (argv.folder) {
                folder = argv.folder;
                outputPath += `/${argv.folder.trim()}-legacy`;
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

                        const noExec = require('./no-exec.json');

                        if (file.includes('stEIP1559')) {
                            await updateNoExec(dir, newOutputName, 'EIP1559 not supported', noExec);
                        }

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
                            if (auxOutputPathName.includes(listNotSupported[e])) {
                                throw new Error('not supported');
                            }
                        }

                        const currentTest = test[keysTests[y]];

                        // check gas used by the tx is less than 30M
                        if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasUsed), zkcommonjs.Constants.BATCH_GAS_LIMIT)) {
                            await updateNoExec(dir, newOutputName, 'tx gas > 30M', noExec);
                        }

                        let accountPkFrom;
                        if (currentTest._info.source.endsWith('.json')) {
                            const source = require(`./tests/${currentTest._info.source}`);
                            accountPkFrom = source[(file.split('/')[file.split('/').length - 1]).split('.json')[0]].transaction.secretKey;
                            accountPkFrom = accountPkFrom.startsWith('0x') ? accountPkFrom : `0x${accountPkFrom}`;
                            accountPkFrom = toBuffer(accountPkFrom);
                        } else {
                            const s = fs.readFileSync(path.join(__dirname, `./tests/${currentTest._info.source}`), 'utf8');
                            let indNum = s.search('secretKey');
                            while (s.substring(indNum, indNum + 1) !== ' ') {
                                indNum += 1;
                            }
                            indNum += 1;
                            if (s.substring(indNum, indNum + 1) === '"' || s.substring(indNum, indNum + 1) === '\'') { indNum += 1; }
                            if (s.substring(indNum, indNum + 2) === '0x') { indNum += 2; }
                            accountPkFrom = toBuffer(`0x${s.substring(indNum, indNum + 64)}`);
                        }
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
                            null,
                            null,
                            chainIdSequencer,
                        );
                        const batch = await zkEVMDB.buildBatch(
                            timestamp,
                            sequencerAddress,
                            zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                        );

                        for (let tx = 0; tx < txsTest.length; tx++) {
                            const txTest = txsTest[tx];
                            if (txTest.type) {
                                await updateNoExec(dir, newOutputName, 'tx.type not supported', noExec);
                            }
                            if (Scalar.e(txTest.gasLimit) > zkcommonjs.Constants.BATCH_GAS_LIMIT) {
                                txsTest[tx].gasLimit = zkcommonjs.Constants.BATCH_GAS_LIMIT;
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
                            const calldata = signData.concat(rCalldata).concat(sCalldata).concat(vCalldata);

                            batch.addRawTx(calldata);
                        }

                        await batch.executeTxs();

                        if (batch.evmSteps[0].length > 0) {
                            const { updatedAccounts } = batch;
                            if (updatedAccounts['0x0000000000000000000000000000000000000002']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled sha256 is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000003']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled ripemd160 is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000006']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled ecAdd is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000007']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled ecMul is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000008']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled ecPairing is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000009']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled blake2f is not supported', noExec);
                            }
                            const steps = batch.evmSteps[0];
                            const selfDestructs = steps.filter((step) => step.opcode.name === 'SELFDESTRUCT');
                            if (selfDestructs.length > 0) {
                                await updateNoExec(dir, newOutputName, 'Selfdestruct', noExec);
                            }
                            const calls = steps.filter((step) => step.opcode.name === 'CALL'
                                || step.opcode.name === 'CALLCODE'
                                || step.opcode.name === 'DELEGATECALL'
                                || step.opcode.name === 'STATICCALL');
                            if (calls.length > 0) {
                                for (let i = 0; i < calls.length; i++) {
                                    const stepBefore = steps[steps.indexOf(calls[i]) - 1];
                                    const addressCall = Scalar.e(stepBefore.stack[stepBefore.stack.length - 2]);
                                    if (addressCall === Scalar.e(2)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled sha256 is not supported', noExec);
                                    } else if (addressCall === Scalar.e(3)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled ripemd160 is not supported', noExec);
                                    } else if (addressCall === Scalar.e(6)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled ecAdd is not supported', noExec);
                                    } else if (addressCall === Scalar.e(7)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled ecMul is not supported', noExec);
                                    } else if (addressCall === Scalar.e(8)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled ecPairing is not supported', noExec);
                                    } else if (addressCall === Scalar.e(9)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled blake2f is not supported', noExec);
                                    }
                                }
                            }
                        }

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

    async function updateNoExec(dir, newOutputName, description, noExec) {
        return
        const auxDir = dir.split('/');
        const nameTest = `${auxDir[auxDir.length - 1]}/${newOutputName.replace('.json', '')}`;
        noExec['not-supported'].push({ name: nameTest, description });
        await fs.writeFileSync('./no-exec.json', JSON.stringify(noExec, null, 2));
        throw new Error('not supported');
    }
});
