const fs = require('fs');
const path = require('path');

const { argv } = require('yargs')
    .alias('f', 'folder');

let folders = [
    '../../../inputs-executor',
    '../../../state-transition',
    '../GeneralStateTests',
    '../../../test/state-transition',
    '../../out-of-counters/',
    '../../../tools-calldata/evm/generate-test-vectors',
    '../../../receipt-test-vectors',
    '../../../tools-calldata/evm/generate-test-forced/gen-sources',
    '../../../tools-calldata/evm/generate-test-forced/inputs',
    '../../../tools-calldata/evm/generate-test-forced/sources',
];

async function writeParams(keys, values, jsonPath) {
    const origin = require(path.join(__dirname, jsonPath));
    if (!origin.length) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];

            origin[key] = value;
        }
    } else {
        for (let ii = 0; ii < origin.length; ii++) {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = values[i];

                origin[ii][key] = value;
            }
        }
    }
    await fs.writeFileSync(jsonPath, JSON.stringify(origin, null, 2));
}

async function main() {
    // Folder path
    const folderPath = typeof (argv.folder) === 'string' ? argv.folder.trim() : undefined;
    const keys = ['forkID'];
    const values = [6];

    if (folderPath) {
        folders = [folderPath];
    }

    if (keys.indexOf('forkID') !== -1) {
        const jsonConfig = '../../../testvectors.config.json';
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
}

main();
