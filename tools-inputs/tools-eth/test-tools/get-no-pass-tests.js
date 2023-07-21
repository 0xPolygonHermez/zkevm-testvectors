/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');
const noExec = require('../no-exec.json');

const pathNoBerlin = './no-berlin-keys.json';
const pathFilesNoExec = './info-files-no-exec.json';
const pathFilesNoExecCSV = './info-files-no-exec.csv';
const pathTxMaxInt = './tx-max-int.json';
let stringCSV = 'Check, File, Reason, Description\n';

// example: npx mocha gen-inputs.js --test xxxx --folder xxxx --ignore
describe('Generate inputs executor from ethereum tests GeneralStateTests\n\n', async function () {
    this.timeout(800000);
    let test;
    let file;
    let basePath = '../tests/BlockchainTests/GeneralStateTests';
    // let allTests;
    let counts = {};
    counts.countTests = 0;
    counts.countErrors = 0;
    counts.countOK = 0;
    counts.countNotSupport = 0;

    it('Load tests & generate inputs', async () => {
        let files = [];
        const pathFolder = path.join(__dirname, basePath);
        const filesDirec = fs.readdirSync(pathFolder);
        for (let y = 0; y < filesDirec.length; y++) {
            const path0 = `${pathFolder}/${filesDirec[y]}`;
            const filesDirec0 = fs.readdirSync(`${path0}`);
            for (let x = 0; x < filesDirec0.length; x++) {
                const path1 = `${path0}/${filesDirec0[x]}`;
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
        }

        const listNoBerlinKeys = [];
        const listTxMaxInt = [];
        const list = [];

        for (let x = 0; x < files.length; x++) {
            file = files[x];
            file = file.endsWith('.json') ? file : `${file}.json`;

            // eslint-disable-next-line import/no-dynamic-require
            test = require(file);

            const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
            const txsLength = keysTests.length;
            if (txsLength === 0) {
                const keysTests2 = Object.keys(test);
                listNoBerlinKeys.push({ file, keysTests2 });
                list.push({
                    file: file.split('/GeneralStateTests/')[1],
                    reason: 'No Berlin Keys',
                    description: 'No Berlin Keys',
                });
                stringCSV += ` ,${file.split('/GeneralStateTests/')[1]}, No Berlin Keys, No Berlin Keys\n`;
            }
        }

        const breaksComputation = noExec['breaks-computation'];
        const notSupported = noExec['not-supported'];

        for (let i = 0; i < breaksComputation.length; i++) {
            const info = breaksComputation[i];
            list.push({
                file: info.name,
                reason: 'Breaks computation',
                description: info.description,
            });
            stringCSV += ` ,${info.name}, Breaks computation, ${info.description}\n`;
        }

        for (let i = 0; i < notSupported.length; i++) {
            const info = notSupported[i];
            if (info.description === 'tx gas > max int') {
                listTxMaxInt.push(info.name);
                list.push({
                    file: info.name,
                    reason: 'Not supported',
                    description: info.description,
                });
                stringCSV += ` ,${info.name}, Not supported, ${info.description}\n`;
            }
        }
        console.log('Files no berlin keys: ', listNoBerlinKeys.length);
        console.log('Files gas > max int: ', listTxMaxInt.length);
        await fs.writeFileSync(pathNoBerlin, JSON.stringify(listNoBerlinKeys, null, 2));
        await fs.writeFileSync(pathTxMaxInt, JSON.stringify(listTxMaxInt, null, 2));
        await fs.writeFileSync(pathFilesNoExec, JSON.stringify(list, null, 2));
        await fs.writeFileSync(pathFilesNoExecCSV, stringCSV);
    });
});
