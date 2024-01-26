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

        const list = [];

        for (let x = 0; x < files.length; x++) {
            file = files[x];
            file = file.endsWith('.json') ? file : `${file}.json`;

            outputName = `${file.split('/')[file.split('/').length - 1]}`;
            // eslint-disable-next-line import/no-dynamic-require
            test = require(file);

            const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin') === true);
            const txsLength = keysTests.length;
            if (txsLength === 0) {
                list.push(file);
            }
        }
        console.log('Files no berlin keys: ', list.length);
        await fs.writeFileSync('./no-berlin-keys.json', JSON.stringify(list, null, 2));
    });
});
