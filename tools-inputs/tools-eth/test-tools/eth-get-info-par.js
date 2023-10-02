/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const { Scalar } = require('ffjavascript');
const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');

const tablePathTemplate = '../final-table.template.txt';
const tablePath = 'final-table.txt';
const listOOC = require('../../../inputs-executor/ethereum-tests/GeneralStateTests/tests-OOC/testsOOC-list.json');

// example: npx mocha gen-inputs.js --test xxxx --folder xxxx --ignore
describe('Generate inputs executor from ethereum tests GeneralStateTests\n\n', async function () {
    this.timeout(800000);
    let poseidon;
    let F;
    let outputName;
    let outputPath;
    let test;
    let file;
    let group;
    let info = {};
    let infoErrors = '';
    let basePath = '../tests/BlockchainTests';
    let tests30M = [];
    let dir30M;
    // let allTests;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('Load tests & generate inputs', async () => {
        outputPath = '../../../inputs-executor/ethereum-tests/GeneralStateTests/';

        let dir = path.join(__dirname, outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        group = argv.group ? argv.group.trim() : 'GeneralStateTests';

        let files = [];
        const pathFolder = path.join(__dirname, `${basePath}/${group}`);
        const filesDirec = fs.readdirSync(pathFolder);
        for (let y = 0; y < filesDirec.length; y++) {
            const path1 = `${pathFolder}/${filesDirec[y]}`;
            let stats = fs.statSync(`${path1}`);
            if (stats.isFile()) {
                files.push(`${path1}`);
            } else {
                info[path1.split('/')[path1.split('/').length - 1]] = {
                    countTests: 0,
                    countErrors: 0,
                    countOK: 0,
                    countNotSupport: 0,
                    notSup: [],
                    errors: [],
                };
                const filesDirec2 = fs.readdirSync(`${path1}`);
                for (let q = 0; q < filesDirec2.length; q++) {
                    const path2 = `${path1}/${filesDirec2[q]}`;
                    stats = fs.statSync(`${path2}`);
                    if (stats.isFile()) {
                        files.push(`${path2}`);
                    } else {
                        const filesDirec3 = fs.readdirSync(`${path2}`);
                        for (let t = 0; t < filesDirec3.length; t++) {
                            const path3 = `${path2}/${filesDirec3[t]}`;
                            stats = fs.statSync(`${path3}`);
                            if (stats.isFile()) {
                                files.push(`${path3}`);
                            } else {
                                const filesDirec4 = fs.readdirSync(`${path3}`);
                                for (let x = 0; x < filesDirec4.length; x++) {
                                    files.push(`${path3}/${filesDirec4[x]}`);
                                }
                            }
                        }
                    }
                }
            }
        }

        for (let x = 0; x < files.length; x++) {
            file = files[x];
            file = file.endsWith('.json') ? file : `${file}.json`;

            outputName = `${file.split('/')[file.split('/').length - 1]}`;
            // eslint-disable-next-line import/no-dynamic-require
            test = require(file);

            let keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
            let txsLength = keysTests.length;
            if (file.includes('push0')) {
                keysTests = Object.keys(test).filter((op) => op.includes('_Berlin+3855') === true);
                txsLength = keysTests.length;
            }
            if (txsLength === 0) {
                keysTests = Object.keys(test).filter((op) => op.includes('_Shanghai') === true);
                txsLength = keysTests.length;
            }
            if (txsLength === 0) {
                infoErrors += 'no Berlin keys\n';
                infoErrors += `${outputName}\n`;
                infoErrors += '--------------------------------------------------\n';
            } else {
                for (let y = 0; y < txsLength; y++) {
                    const key = Object.keys(info).filter((x) => file.includes(`${x}/`));
                    info[key].countTests++;
                    let newOutputName;
                    let writeOutputName = dir + file.split('GeneralStateTests/')[1].split(outputName)[0].split('/')[0];

                    const noExec = require('../no-exec.json');
                    try {
                        if (txsLength > 1) newOutputName = `${outputName.split('.json')[0]}_${y}.json`;
                        else newOutputName = outputName;
                        writeOutputName += `/${newOutputName}`;

                        // console.log('Test name: ', newOutputName);

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

                        const currentTest = test[keysTests[y]];
                        // check gas used by the tx is less than 30M
                        // to pass VMTests/vmIOandFlowOperations/gas test is necessary update gasLimit
                        if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasUsed), zkcommonjs.Constants.TX_GAS_LIMIT)
                        || file.includes('VMTests/vmIOandFlowOperations/gas')) {
                            writeOutputName = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 2], 'tests-30M');
                        } else if (Scalar.gt(Scalar.e(currentTest.blocks[0].blockHeader.gasLimit), Scalar.e('0x7FFFFFFF'))) {
                            writeOutputName = writeOutputName.replace(writeOutputName.split('/')[writeOutputName.split('/').length - 2], 'tests-30M');
                        }
                        if (fs.existsSync(writeOutputName)) {
                            info[key].countOK++;
                        } else if (listOOC.filter((x) => x.fileName.includes(newOutputName)).length > 0) {
                            info[key].countOK++;
                        } else {
                            throw new Error('test does not exist');
                        }
                    } catch (e) {
                        if (e.toString() === 'Error: not supported') {
                            info[key].countNotSupport++;
                            info[key].notSup.push(writeOutputName);
                        }
                        if (e.toString() === 'Error: breaks computation test') {
                            info[key].countErrors++;
                        }
                        if (e.toString() === 'Error: test does not exist') {
                            info[key].countErrors++;
                            info[key].errors.push(writeOutputName);
                        }
                    }
                }
            }
        }
        let tableText;
        try {
            tableText = fs.readFileSync(tablePathTemplate, 'utf-8');
        } catch (e) {
            throw new Error("'final-table.txt' file does not exist");
        }
        const tableRows = tableText.split('\n');
        let newTable = `${tableRows[0]}\n${tableRows[1]}`;
        for (let i = 2; i < tableRows.length; i++) {
            const tableCel = tableRows[i].split('|');
            const name = tableCel[1].trim();
            newTable += `\n${tableCel[0]}|${tableCel[1]}`;
            const total = tableCel[2].trim();
            const totalNum = info[name].countTests;
            newTable += `|${tableCel[2].replace(total, totalNum)}`;
            const ok = tableCel[3].trim();
            const okNum = info[name].countOK;
            newTable += `|${tableCel[3].replace(ok, okNum)}`;
            const errors = tableCel[4].trim();
            const genErrors = info[name].countErrors;
            const errNum = Number(genErrors);
            newTable += `|${tableCel[4].replace(errors, errNum)}`;
            const ignored = tableCel[5].trim();
            const ignoredNum = info[name].countNotSupport;
            newTable += `|${tableCel[5].replace(ignored, ignoredNum)}`;
            const cov = tableCel[6].trim();
            let covNum;
            if (totalNum - ignoredNum === 0) {
                covNum = (100).toFixed(2);
            } else {
                covNum = (100 * okNum / (totalNum - ignoredNum)).toFixed(2);
            }
            newTable += `|${tableCel[6].replace(cov, covNum)}|`;
        }
        await fs.writeFileSync(tablePath, newTable);
        await fs.writeFileSync(`${tablePath}-2`, JSON.stringify(info, null, 1));
    });
});
