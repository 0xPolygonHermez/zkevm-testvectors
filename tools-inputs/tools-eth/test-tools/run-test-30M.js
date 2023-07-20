const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { argv } = require('yargs')
    .alias('i', 'input')
    .alias('r', 'romFolder')
    .alias('p', 'proverjsFolder');

async function main() {
    const path30M = '../GeneralStateTests/tests-30M/';

    try {
        const writeOutputName = argv.input;
        const test = require(writeOutputName);
        const testPath = path30M + writeOutputName.split('/')[writeOutputName.split('/').length - 1];
        const { gasLimit } = test;
        // console.log(`cd ${argv.r.trim()} && mkdir -p build && npx zkasm main/main.zkasm -o build/rom-gas.json -D TX_GAS_LIMIT=${gasLimit}\n`);
        const res = await execSync(`cd ${argv.r.trim()} && mkdir -p build && npx zkasm main/main.zkasm -o build/rom-gas.json -D TX_GAS_LIMIT=${gasLimit}`);
        // console.log(`stdout: ${res}\n`);
        const testPath2 = path.join('../../../zkevm-testvectors/tools-inputs/tools-eth/test-tools', testPath);
        // console.log(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom-gas.json\n`);
        const res2 = await execSync(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom-gas.json`);
        // console.log(`stdout: ${res2}\n`);
    } catch (e) {
        console.log('Error test: ', e.toString());
    }
}

main();
