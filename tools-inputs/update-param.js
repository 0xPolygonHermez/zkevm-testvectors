/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const { argv } = require('yargs')
    .alias('f', 'folder');
const path = require('path');

let folders = [
    path.join(__dirname, '../inputs-executor'),
    path.join(__dirname, '../inputs-executor/ethereum-tests/GeneralStateTests'),
    path.join(__dirname, '../inputs-executor/special-inputs-ignore/forcedtx-inputs-ignore'),
    path.join(__dirname, '../inputs-executor/special-inputs-ignore/stateoverride-inputs-ignore'),
    path.join(__dirname, './data'),
    path.join(__dirname, '../receipt-test-vectors'),
    path.join(__dirname, '../test/state-transition'),
    path.join(__dirname, '../tools/out-of-counters'),
    path.join(__dirname, './generate-test-forced'),
    path.join(__dirname, './tools-calldata'),
];

async function writeParams(keys, values, jsonPath) {
    const origin = require(jsonPath);
    if (!origin.length) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];

            origin[key] = value;
        }
    } else {
        for (let j = 0; j < origin.length; j++) {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = values[i];

                origin[j][key] = value;
            }
        }
    }
    await fs.writeFileSync(jsonPath, JSON.stringify(origin, null, 2));
}

async function main() {
    // Folder path
    const folderPath = typeof (argv.folder) === 'string' ? argv.folder.trim() : undefined;
    const keys = ['oldAccInputHash', 'newAccInputHash'];
    const values = [];

    if (folderPath) {
        folders = [folderPath];
    }

    if (keys.indexOf('forkID') !== -1) {
        const jsonConfig = './testvectors.config.json';
        const config = require(jsonConfig);
        config.forkID = values[keys.indexOf('forkID')];
        await fs.writeFileSync(jsonConfig, JSON.stringify(config, null, 2));
    }

    for (let q = 0; q < folders.length; q++) {
        const files = fs.readdirSync(folders[q]);
        for (let j = 0; j < files.length; j++) {
            const path1 = files[j];
            const stats = fs.statSync(`${folders[q]}/${path1}`);
            if (!stats.isFile()) {
                const files2 = fs.readdirSync(`${folders[q]}/${path1}`);
                for (let x = 0; x < files2.length; x++) {
                    if (files2[x].endsWith('.json')) {
                        const jsonPath = path.join(`${folders[q]}/${path1}`, files2[x]);
                        // console.log('WRITE1: ', jsonPath);
                        await writeParams(keys, values, jsonPath);
                    }
                }
            } else if (path1.endsWith('.json')) {
                const jsonPath = path.join(`${folders[q]}/${path1}`);
                // console.log('WRITE2: ', jsonPath);
                await writeParams(keys, values, jsonPath);
            }
        }
    }
    console.log('Finished updating params');
}

main();
