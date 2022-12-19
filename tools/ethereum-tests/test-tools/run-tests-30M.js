const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { argv } = require('yargs')
    .alias('l', 'list')
    .alias('r', 'romFolder')
    .alias('p', 'proverjsFolder');

async function main() {
    let path30M;
    let list30M;
    let info30M = '';
    let countErrors = 0;
    let countOK = 0;

    try {
        const path30MList = argv.l.trim();
        list30M = require(path30MList);
        path30M = path30MList.replace(path30MList.split('/')[path30MList.split('/').length - 1], '');
    } catch (e) {
        throw new Error('Invalid list 30M');
    }
    let gasLimit;
    for (let i = 0; i < list30M.length; i++) {
        try {
            const { writeOutputName } = list30M[i];
            const test = require(writeOutputName);
            const testPath = path30M + writeOutputName.split('/')[writeOutputName.split('/').length - 1];
            gasLimit = test.gasLimit;
            // console.log(`cd ${argv.r.trim()} && mkdir -p build && npx zkasm main/main.zkasm -o build/rom-gas.json -D TX_GAS_LIMIT=${gasLimit}\n`);
            info30M += `cd ${argv.r.trim()} && mkdir -p build && npx zkasm main/main.zkasm -o build/rom-gas.json -D TX_GAS_LIMIT=${gasLimit}\n`;
            const res = await execSync(`cd ${argv.r.trim()} && mkdir -p build && npx zkasm main/main.zkasm -o build/rom-gas.json -D TX_GAS_LIMIT=${gasLimit}`);
            // console.log(`stdout: ${res}\n`);
            info30M += `stdout: ${res}\n`;
            const testPath2 = path.join('../../../zkevm-testvectors/tools/ethereum-tests/test-tools', testPath);
            // console.log(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom-gas.json\n`);
            info30M += `cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom-gas.json\n`;
            const res2 = await execSync(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom-gas.json`);
            // console.log(`stdout: ${res2}\n`);
            info30M += `stdout: ${res2}\n`;
            if (res2.includes('Assert outputs run succesfully')) {
                countOK += 1;
            } else {
                countErrors += 1;
            }
        } catch (e) {
            console.log('Error test: ', e.toString());
        }
    }
    let info = '';
    info += 'files: 0\n';
    info += `tests: ${list30M.length}\n`;
    info += `inputs: ${list30M.length}\n`;
    info += 'errors: 0\n';
    info += 'not-supported: 0\n';

    let infoOK = '';
    infoOK += `inputs: ${list30M.length}\n`;
    infoOK += `ok: ${countOK}\n`;
    infoOK += `errors: ${countErrors}\n`;

    await fs.writeFileSync(`${path30M}/info.txt`, info);
    await fs.writeFileSync(`${path30M}/info-30M.txt`, info30M);
    await fs.writeFileSync(`${path30M}/info-inputs.txt`, infoOK);
}

main();
