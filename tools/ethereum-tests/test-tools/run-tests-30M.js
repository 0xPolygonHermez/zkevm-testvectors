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
    let newList30M;
    let path30MList;
    let info30M = '';
    let countErrors = 0;
    let countOK = 0;

    try {
        path30MList = argv.l.trim();
        list30M = require(path30MList);
        newList30M = list30M;
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
                if (res2.includes('OOC')) {
                    newList30M = newList30M.filter((e) => e.writeOutputName !== writeOutputName);
                } else {
                    fs.rename(writeOutputName, `${writeOutputName}-ignore`, () => {});
                }
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
    await fs.writeFileSync(path30MList, JSON.stringify(newList30M, null, 2));
}

main();
