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
const helpers = require('../../../tools-calldata/helpers/helpers');
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
    let evmDebug;
    let basePath = '../tests/BlockchainTests/GeneralStateTests';

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('Load tests & generate inputs', async () => {
        const noExec = require('../no-exec.json');
        const nameError = argv.error.trim();
        let listOOC = noExec['not-supported'].filter((x) => x.description.includes(nameError));
        if (argv.test) {
            listOOC = listOOC.filter((x2) => x2.name.includes(argv.test));
        }
        console.log(listOOC);
        let numTest = 0;
        outputPath = `./tests-${nameError}`;

        let dir = path.join(__dirname, outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        for (let x = 0; x < listOOC.length; x++) {
            file = `${basePath}/${listOOC[x].name}`;
            file = file.endsWith(".json") ? file.replace(".json", "") : file;

            try {
                test = require(`${file}.json`);
            } catch (e) {
                try {
                    if (file.split('_')[file.split('_').length - 1]) {
                        numTest = file.split('_')[file.split('_').length - 1];
                        file = file.split('_').slice(0, file.split('_').length - 1).join('_');
                        test = require(`${file}.json`);
                    } else {
                        throw Error('no exist file');
                    }
                } catch (e2) {
                    try {
                        file = `${basePath}/${listOOC[x].name}`;
                        if(file.includes("VMTests")) {
                            directory = `${basePath}/VMTests`;
                            const allFilesVMTests = getAllFiles(directory);
                            file = allFilesVMTests.filter((f) => f.includes(listOOC[x].name.split("/")[1]))
                            if(file.length > 0) {
                                file = file[0];
                                test = require(`${file}`);
                            } else {
                                file = listOOC[x].name.split("/")[1]
                                numTest = file.split('_')[file.split('_').length - 1];
                                file = file.split('_').slice(0, file.split('_').length - 1).join('_');
                                file = allFilesVMTests.filter((x) => x.includes(file))[0];
                                test = require(`${file}`);
                            }
                        }
                    } catch (e3){
                        throw Error('no exist file');
                    }
                }
            }

            outputName = `${file.split('/')[file.split('/').length - 1]}`;

            let keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
            let flagName = false;
            if (numTest) {
                if (keysTests.length > 1) flagName = true;
                keysTests = [keysTests[numTest]];
            }
            const txsLength = keysTests.length;
            if (txsLength === 0) {
                infoErrors += 'no Berlin keys\n';
                infoErrors += `${outputName}\n`;
                infoErrors += '--------------------------------------------------\n';
            } else {
                for (let y = 0; y < txsLength; y++) {
                    let newOutputName;
                    try {
                        if (txsLength > 1 && !numTest) newOutputName = `${outputName.split('.json')[0]}_${y}.json`;
                        else if (numTest && flagName) newOutputName = `${outputName.split('.json')[0]}_${numTest}.json`;
                        else newOutputName = `${outputName.split('.json')[0]}.json`;

                        console.log('Test name: ', newOutputName);

                        if (!fs.existsSync(`${dir}/${newOutputName}` || argv.update)) {
                            const currentTest = test[keysTests[y]];
                            // check gas used by the tx is less than 30M
                            if(!nameError.includes("30M")) {
                                if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasUsed), zkcommonjs.Constants.BATCH_GAS_LIMIT)) {
                                    await updateNoExec(listOOC[x].name, 'tx gas > 30M', noExec);
                                }
                            } 

                            let accountPkFrom;
                            if (currentTest._info.source.endsWith('.json')) {
                                let source;
                                try {
                                    source = require(`../tests/${currentTest._info.source}`);
                                } catch (e) {
                                    throw new Error('Error: ethereum/tests error');
                                }
                                accountPkFrom = source[(file.split('/')[file.split('/').length - 1]).split('.json')[0]].transaction.secretKey;
                                accountPkFrom = accountPkFrom.startsWith('0x') ? accountPkFrom : `0x${accountPkFrom}`;
                                accountPkFrom = toBuffer(accountPkFrom);
                            } else if (currentTest._info.source.endsWith('.yml')) {
                                let s;
                                try {
                                    s = fs.readFileSync(path.join(__dirname, `../tests/${currentTest._info.source}`), 'utf8');
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

                            const batch = await zkEVMDB.buildBatch(
                                timestamp,
                                sequencerAddress,
                                zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                            );
                            if (txsTest.length === 0) {
                                if (currentTest.blocks[0].transactionSequence.length > 0) {
                                    for (let tx = 0; tx < currentTest.blocks[0].transactionSequence.length; tx++) {
                                        const { rawBytes } = currentTest.blocks[0].transactionSequence[tx];
                                        const transaction = ethers.utils.parseTransaction(rawBytes);
                                        if (transaction.type) {
                                            await updateNoExec(listOOC[x].name, 'tx.type not supported', noExec);
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
                                    await updateNoExec(listOOC[x].name, 'tx.type not supported', noExec);
                                }
                                if (txTest.to === '0x0000000000000000000000000000000000000002') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled sha256 is not supported', noExec);
                                } else if (txTest.to === '0x0000000000000000000000000000000000000003') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ripemd160 is not supported', noExec);
                                } else if (txTest.to === '0x0000000000000000000000000000000000000005') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled modexp is not supported', noExec);
                                } else if (txTest.to === '0x0000000000000000000000000000000000000006') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ecAdd is not supported', noExec);
                                } else if (txTest.to === '0x0000000000000000000000000000000000000007') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ecMul is not supported', noExec);
                                } else if (txTest.to === '0x0000000000000000000000000000000000000008') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ecPairing is not supported', noExec);
                                } else if (txTest.to === '0x0000000000000000000000000000000000000009') {
                                    await updateNoExec(listOOC[x].name, 'Precompiled blake2f is not supported', noExec);
                                }

                                if (Scalar.e(txTest.gasLimit) > zkcommonjs.Constants.BATCH_GAS_LIMIT) {
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
                                    await updateNoExec(listOOC[x].name, 'Precompiled sha256 is not supported', noExec);
                                } else if (updatedAccounts['0x0000000000000000000000000000000000000003']) {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ripemd160 is not supported', noExec);
                                } else if (updatedAccounts['0x0000000000000000000000000000000000000005']) {
                                    await updateNoExec(listOOC[x].name, 'Precompiled modexp is not supported', noExec);
                                } else if (updatedAccounts['0x0000000000000000000000000000000000000006']) {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ecAdd is not supported', noExec);
                                } else if (updatedAccounts['0x0000000000000000000000000000000000000007']) {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ecMul is not supported', noExec);
                                } else if (updatedAccounts['0x0000000000000000000000000000000000000008']) {
                                    await updateNoExec(listOOC[x].name, 'Precompiled ecPairing is not supported', noExec);
                                } else if (updatedAccounts['0x0000000000000000000000000000000000000009']) {
                                    await updateNoExec(listOOC[x].name, 'Precompiled blake2f is not supported', noExec);
                                }
                                const steps = batch.evmSteps[0];
                                const selfDestructs = steps.filter((step) => step.opcode.name === 'SELFDESTRUCT');
                                if (selfDestructs.length > 0) {
                                    await updateNoExec(listOOC[x].name, 'Selfdestruct', noExec);
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
                                            await updateNoExec(listOOC[x].name, 'Precompiled sha256 is not supported', noExec);
                                        } else if (addressCall === Scalar.e(3)) {
                                            await updateNoExec(listOOC[x].name, 'Precompiled ripemd160 is not supported', noExec);
                                        } else if (addressCall === Scalar.e(5)) {
                                            await updateNoExec(listOOC[x].name, 'Precompiled modexp is not supported', noExec);
                                        } else if (addressCall === Scalar.e(6)) {
                                            await updateNoExec(listOOC[x].name, 'Precompiled ecAdd is not supported', noExec);
                                        } else if (addressCall === Scalar.e(7)) {
                                            await updateNoExec(listOOC[x].name, 'Precompiled ecMul is not supported', noExec);
                                        } else if (addressCall === Scalar.e(8)) {
                                            await updateNoExec(listOOC[x].name, 'Precompiled ecPairing is not supported', noExec);
                                        } else if (addressCall === Scalar.e(9)) {
                                            await updateNoExec(listOOC[x].name, 'Precompiled blake2f is not supported', noExec);
                                        }
                                    }
                                }
                            }

                            if (evmDebug) {
                                await generateEvmDebugFile(batch.evmSteps, newOutputName, dir);
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
                                            expect(Scalar.e(newLeaf.balance).toString()).to.be
                                                .equal(Scalar.e(infoExpect.balance).toString());
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
                        } else {
                            console.log(`File exist: ${dir}/${newOutputName}`);
                        }
                        if(test30M.length > 0) {
                            const dir30M = path.join(__dirname, `${outputPath}/tests-30M`);
                            if (!fs.existsSync(dir30M)) {
                                fs.mkdirSync(dir30M);
                            }
                            await fs.writeFileSync(`${dir30M}/test30M-list.json`, JSON.stringify(test30M, null, 2));
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }
    });

    async function generateEvmDebugFile(evmTxSteps, fileName) {
        // Create dir if not exists
        const dir = path.join(__dirname, `${outputPath}/evm-stack-logs`);
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

    async function updateNoExec(nameTest, description, noExec) {
        const index = noExec['not-supported'].findIndex(test => test.name === nameTest);
        noExec['not-supported'][index].description = description;
        await fs.writeFileSync('../no-exec.json', JSON.stringify(noExec, null, 2));
        throw new Error('not supported');
    }

    function getAllFiles(dirPath, arrayOfFiles) {
        files = fs.readdirSync(dirPath)

        arrayOfFiles = arrayOfFiles || []

        files.forEach(function(file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
            } else {
                arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
            }
        })
        return arrayOfFiles
    }
});
