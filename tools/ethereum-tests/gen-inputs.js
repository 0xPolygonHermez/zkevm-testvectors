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
    let evmDebug;
    let info = '';
    let infoErrors = '';
    let basePath = './tests/BlockchainTests';
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
        if (argv.output) {
            outputPath = argv.output.trim();
        } else {
            outputPath = '';
        }

        let dir = path.join(__dirname, outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        group = argv.group ? argv.group.trim() : 'GeneralStateTests';
        if (argv.folder) {
            outputPath += `/${group}`;
            dir = path.join(__dirname, outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            folder = argv.folder;
            outputPath += `/${argv.folder.trim()}/`;
            dir = path.join(__dirname, outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        } else if (argv.test) {
            const fileTest = `/${group}/${argv.test.trim()}`;
            file = fileTest;
            outputPath += `/${group}/${argv.test.trim().split('/')[0]}`;
            let auxOutputPath = '';
            for (let i = 0; i < outputPath.split('/').length; i++) {
                auxOutputPath += `${outputPath.split('/')[i]}/`;
                dir = path.join(__dirname, auxOutputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }
        } else {
            throw new Error('folder or test flag is required');
        }
        evmDebug = !!(argv['evm-debug']);
        let files = [];
        if (folder) {
            const pathFolder = path.join(__dirname, `${basePath}/${group}/${folder}`);
            const filesDirec = fs.readdirSync(pathFolder);
            for (let y = 0; y < filesDirec.length; y++) {
                const path1 = `${pathFolder}/${filesDirec[y]}`;
                let stats = fs.statSync(`${path1}`);
                if (stats.isFile()) {
                    files.push(`${path1}`);
                } else {
                    const filesDirec2 = fs.readdirSync(`${path1}`);
                    for (let q = 0; q < filesDirec2.length; q++) {
                        const path2 = `${path1}/${filesDirec2[q]}`;
                        stats = fs.statSync(`${path2}`);
                        if (stats.isFile()) {
                            files.push(`${path2}`);
                        } else {
                            const filesDirec3 = fs.readdirSync(`${path2}`);
                            for (let t = 0; t < filesDirec3.length; t++) {
                                files.push(`${path2}/${filesDirec3[t]}`);
                            }
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
                    let options = {};
                    let flag30M = false;
                    counts.countTests += 1;
                    let newOutputName;
                    let writeOutputName = dir;
                    const noExec = require('./no-exec.json');
                    try {
                        if (txsLength > 1) newOutputName = `${outputName.split('.json')[0]}_${y}.json`;
                        else newOutputName = outputName;
                        writeOutputName += newOutputName;

                        console.log('Test name: ', newOutputName);

                        const auxOutputPathName1 = writeOutputName;
                        const auxOutputPathName2 = `${file.split('.json')[0]}_${y}`;

                        const listBreaksComputation = [];
                        noExec['breaks-computation'].forEach((elem) => listBreaksComputation.push(elem.name));

                        for (let e = 0; e < listBreaksComputation.length; e++) {
                            if (auxOutputPathName1.includes(listBreaksComputation[e])
                            || auxOutputPathName2.includes(listBreaksComputation[e])) {
                                throw new Error('breaks computation test');
                            }
                        }

                        const listNotSupported = [];
                        noExec['not-supported'].forEach((elem) => listNotSupported.push(elem.name));

                        for (let e = 0; e < listNotSupported.length; e++) {
                            if (auxOutputPathName1.includes(listNotSupported[e])
                            || auxOutputPathName2.includes(listNotSupported[e])) {
                                throw new Error('not supported');
                            }
                        }

                        if (file.includes('stEIP1559')) {
                            await updateNoExec(dir, newOutputName, 'EIP1559 not supported', noExec);
                        }

                        const currentTest = test[keysTests[y]];

                        // check gas used by the tx is less than 30M
                        // to pass VMTests/vmIOandFlowOperations/gas test is necessary update gasLimit
                        if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasUsed), zkcommonjs.Constants.BATCH_GAS_LIMIT)
                        || file.includes('VMTests/vmIOandFlowOperations/gas')) {
                            // if tx gas > maxInt --> ignored
                            if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasUsed), Scalar.e('0x7FFFFFFF'))
                            || Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasLimit), Scalar.e('0x7FFFFFFF'))) {
                                await updateNoExec(dir, newOutputName, 'tx gas > max int', noExec);
                            } else {
                                options.newBatchGasLimit = Scalar.e(currentTest.blocks[0].blockHeader.gasLimit);
                            }
                            writeOutputName = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 2], 'tests-30M');
                            tests30M.push({ writeOutputName, file });
                            dir30M = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 1], '');
                            if (!fs.existsSync(dir30M)) {
                                fs.mkdirSync(dir30M);
                            }
                            flag30M = true;
                        } else if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasLimit), Scalar.e('0x7FFFFFFF'))) {
                            options.newBatchGasLimit = Scalar.e('0x7FFFFFFF');
                            writeOutputName = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 2], 'tests-30M');
                            tests30M.push({ writeOutputName, file });
                            dir30M = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 1], '');
                            if (!fs.existsSync(dir30M)) {
                                fs.mkdirSync(dir30M);
                            }
                            flag30M = true;
                        }

                        let accountPkFrom;
                        if (currentTest._info.source.endsWith('.json')) {
                            let source;
                            try {
                                source = require(`./tests/${currentTest._info.source}`);
                            } catch (e) {
                                throw new Error('Error: ethereum/tests error');
                            }
                            accountPkFrom = source[(file.split('/')[file.split('/').length - 1]).split('.json')[0]].transaction.secretKey;
                            accountPkFrom = accountPkFrom.startsWith('0x') ? accountPkFrom : `0x${accountPkFrom}`;
                            accountPkFrom = toBuffer(accountPkFrom);
                        } else if (currentTest._info.source.endsWith('.yml')) {
                            let s;
                            try {
                                s = fs.readFileSync(path.join(__dirname, `./tests/${currentTest._info.source}`), 'utf8');
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
                        const chainIdSequencer = 1000;
                        const forkID = 1;
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
                            forkID,
                        );

                        const batch = await zkEVMDB.buildBatch(
                            timestamp,
                            sequencerAddress,
                            zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                            undefined,
                            options,
                        );

                        if (txsTest.length === 0) {
                            if (currentTest.blocks[0].transactionSequence.length > 0) {
                                for (let tx = 0; tx < currentTest.blocks[0].transactionSequence.length; tx++) {
                                    const { rawBytes } = currentTest.blocks[0].transactionSequence[tx];
                                    const transaction = ethers.utils.parseTransaction(rawBytes);
                                    if (transaction.type) {
                                        await updateNoExec(dir, newOutputName, 'tx.type not supported', noExec);
                                    }
                                    transaction.gasPrice = transaction.gasPrice._hex;
                                    transaction.gasLimit = transaction.gasLimit._hex;
                                    transaction.value = transaction.value._hex;
                                    txsTest.push(transaction);
                                }
                            }
                        }
                        for (let tx = 0; tx < txsTest.length; tx++) {
                            const txTest = txsTest[tx];
                            if (txTest.type) {
                                await updateNoExec(dir, newOutputName, 'tx.type not supported', noExec);
                            }
                            if (txTest.to === '0x0000000000000000000000000000000000000002') {
                                await updateNoExec(dir, newOutputName, 'Precompiled sha256 is not supported', noExec);
                            } else if (txTest.to === '0x0000000000000000000000000000000000000003') {
                                await updateNoExec(dir, newOutputName, 'Precompiled ripemd160 is not supported', noExec);
                            } else if (txTest.to === '0x0000000000000000000000000000000000000005') {
                                await updateNoExec(dir, newOutputName, 'Precompiled modexp is not supported', noExec);
                            } else if (txTest.to === '0x0000000000000000000000000000000000000006') {
                                await updateNoExec(dir, newOutputName, 'Precompiled ecAdd is not supported', noExec);
                            } else if (txTest.to === '0x0000000000000000000000000000000000000007') {
                                await updateNoExec(dir, newOutputName, 'Precompiled ecMul is not supported', noExec);
                            } else if (txTest.to === '0x0000000000000000000000000000000000000008') {
                                await updateNoExec(dir, newOutputName, 'Precompiled ecPairing is not supported', noExec);
                            } else if (txTest.to === '0x0000000000000000000000000000000000000009') {
                                await updateNoExec(dir, newOutputName, 'Precompiled blake2f is not supported', noExec);
                            }

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
                            const calldata = signData.concat(rCalldata).concat(sCalldata).concat(vCalldata);

                            batch.addRawTx(calldata);
                        }

                        await batch.executeTxs();

                        if (batch.evmSteps[0] && batch.evmSteps[0].length > 0) {
                            const { updatedAccounts } = batch;
                            if (updatedAccounts['0x0000000000000000000000000000000000000002']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled sha256 is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000003']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled ripemd160 is not supported', noExec);
                            } else if (updatedAccounts['0x0000000000000000000000000000000000000005']) {
                                await updateNoExec(dir, newOutputName, 'Precompiled modexp is not supported', noExec);
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
                                    } else if (addressCall === Scalar.e(5)) {
                                        await updateNoExec(dir, newOutputName, 'Precompiled modexp is not supported', noExec);
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

                        if (evmDebug) {
                            await generateEvmDebugFile(batch.evmSteps, newOutputName);
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
                        if (options.newBatchGasLimit) { circuitInput.gasLimit = Scalar.e(options.newBatchGasLimit).toString(); }
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
                        let listOOC = [];
                        const dirOOC = (writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 2], 'tests-OOC')).replace(writeOutputName.split('/')[writeOutputName.split('/').length - 1], '');
                        if (fs.existsSync(`${dirOOC}/testsOOC-list.json`)) {
                            listOOC = require(`${dirOOC}/testsOOC-list.json`);
                        }

                        if (listOOC.filter((elem) => elem.fileName === writeOutputName).length > 0) {
                            const writeNameOOC = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 2], 'tests-OOC');
                            const testOOC = require(writeNameOOC);

                            if (testOOC.stepsN) { circuitInput.stepsN = testOOC.stepsN; }
                            await fs.writeFileSync(writeNameOOC, JSON.stringify(circuitInput, null, 2));
                            if (flag30M) {
                                console.log('DELETE: ', writeOutputName);
                                tests30M = tests30M.filter((e) => e.writeOutputName !== writeOutputName);
                            }
                        } else {
                            await fs.writeFileSync(writeOutputName, JSON.stringify(circuitInput, null, 2));
                        }
                        console.log(`WRITE: ${writeOutputName}\n`);
                        if (!flag30M) counts.countOK += 1;
                    } catch (e) {
                        if (options.newBatchGasLimit && Scalar.eq(options.newBatchGasLimit, Scalar.e('0x7FFFFFFF')) && (e.toString() !== 'Error: not supported')) {
                            let auxDir = dir.endsWith('/') ? dir.substring(0, dir.length - 1) : dir;
                            auxDir = auxDir.split('/');
                            const nameTest = `${auxDir[auxDir.length - 1]}/${newOutputName.replace('.json', '')}`;
                            noExec['not-supported'].push({ name: nameTest, description: 'tx gas > max int' });
                            await fs.writeFileSync('./no-exec.json', JSON.stringify(noExec, null, 2));
                            counts.countNotSupport += 1;
                            infoErrors += 'Error: not supported\n';
                            infoErrors += `${newOutputName}\n`;
                            infoErrors += '--------------------------------------------------\n';
                            console.log('Error: not supported\n');
                        } else {
                            console.log(e);
                            console.log();
                            if (flag30M) {
                                tests30M = tests30M.filter((test30M) => test30M.writeOutputName !== writeOutputName);
                            }
                            if (e.toString() === 'Error: not supported') {
                                counts.countNotSupport += 1;
                            } else {
                                counts.countErrors += 1;
                            }
                            infoErrors += `${e.toString()}\n`;
                            infoErrors += `${newOutputName}\n`;
                            infoErrors += '--------------------------------------------------\n';
                        }
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
        if (tests30M.length > 0) {
            let list = [];
            if (fs.existsSync(`${dir30M}/tests30M-list.json`)) {
                list = require(`${dir30M}/tests30M-list.json`);
            }
            for (let i = 0; i < tests30M.length; i++) {
                if (list.indexOf(tests30M[i]) === -1) { list.push(tests30M[i]); }
            }
            console.log(`WRITE list 30M: ${dir30M}/tests30M-list.json`);
            await fs.writeFileSync(`${dir30M}/tests30M-list.json`, JSON.stringify(list, null, 2));
            counts.countTests -= tests30M.length;
        }
        if (allTests) {
            const lengthAllTests = files.length;
            info += `files: ${lengthAllTests}\n`;
            info += `tests: ${counts.countTests}\n`;
            info += `inputs: ${counts.countOK}\n`;
            info += `errors: ${counts.countErrors}\n`;
            info += `not-supported: ${counts.countNotSupport}\n`;
            dir = path.join(__dirname, outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            await fs.writeFileSync(`${dir}/info.txt`, info);
        }
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
                        let memory = step.memory.map((v) => v.toString(16)).join('').padStart(192, '0');
                        memory = memory.match(/.{1,32}/g); // split in 32 bytes slots
                        memory = memory.map((v) => `0x${v}`);

                        stepObjs.push({
                            pc: step.pc,
                            depth: step.depth,
                            opcode: {
                                name: step.opcode.name,
                                fee: step.opcode.fee,
                            },
                            gasLeft: Number(step.gasLeft),
                            gasRefund: Number(step.gasRefund),
                            memory,
                            stack: step.stack.map((v) => `0x${v.toString('hex')}`),
                            codeAddress: step.codeAddress.buf.reduce(
                                (previousValue, currentValue) => previousValue + currentValue,
                                '0x',
                            ),
                        });
                    }
                }
                data[txId] = stepObjs;
                txId += 1;
            }
        }
        fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2));
    }

    async function updateNoExec(dir, newOutputName, description, noExec) {
        let auxDir = dir.endsWith('/') ? dir.substring(0, dir.length - 1) : dir;
        auxDir = auxDir.split('/');
        const nameTest = `${auxDir[auxDir.length - 1]}/${newOutputName.replace('.json', '')}`;
        noExec['not-supported'].push({ name: nameTest, description });
        await fs.writeFileSync('./no-exec.json', JSON.stringify(noExec, null, 2));
        throw new Error('not supported');
    }
});
