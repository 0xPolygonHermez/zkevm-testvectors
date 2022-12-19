const { argv } = require('yargs')
    .alias('l', 'list')
    .alias('p', 'proverjsFolder')
    .alias('s', 'steps');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
    let listOOC;
    let pathOOC;
    let countMax = 0;
    let countErrors = 0;
    let countOK = 0;
    let pathOOCList;

    try {
        pathOOCList = argv.l.trim();
        listOOC = require(pathOOCList);
        pathOOC = pathOOCList.replace(pathOOCList.split('/')[pathOOCList.split('/').length - 1], '');
    } catch (e) {
        throw new Error('Invalid list OOC');
    }
    let infoOOC = '';

    for (let i = 0; i < listOOC.length; i++) {
        const { fileName } = listOOC[i];
        const testPath = pathOOC + fileName.split('/')[fileName.split('/').length - 1];
        const testPath2 = path.join('../../../zkevm-testvectors/tools/ethereum-tests/test-tools', testPath);
        let stepsN;
        if (argv.steps) stepsN = listOOC[i].stepsN;
        else stepsN = 8388608;
        // console.log(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom.json -c -n ${stepsN}`);
        infoOOC += `cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom.json -c -n ${stepsN}`;
        let res = await execSync(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom.json -c -n ${stepsN}`);
        // console.log(`stdout: ${res}\n`);
        infoOOC += `stdout: ${res}\n`;

        while ((res.includes('OOCS') || res.includes('Not enough steps')) && countMax < 2) {
            countMax += 1;
            stepsN *= 2;
            infoOOC += `cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom.json -c -n ${stepsN}`;
            // console.log(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom.json -c -n ${stepsN}`);
            res = await execSync(`cd ${argv.p.trim()}/tools/run-test && node --max-old-space-size=12000 run-inputs.js -i ${testPath2} -r ../../../zkevm-rom/build/rom.json -c -n ${stepsN}`);
            // console.log(`stdout: ${res}\n`);
            infoOOC += `stdout: ${res}\n`;
        }
        // console.log('countMax: ', countMax);
        if (countMax < 2) {
            countOK += 1;
            listOOC[i].stepsN = stepsN;
        } else {
            countErrors += 1;
            listOOC[i].stepsN = 0;
        }
        countMax = 0;
        await fs.writeFileSync(pathOOCList, JSON.stringify(listOOC, null, 2));
    }

    let info = '';
    info += 'files: 0\n';
    info += `tests: ${listOOC.length}\n`;
    info += `inputs: ${listOOC.length}\n`;
    info += 'errors: 0\n';
    info += 'not-supported: 0\n';

    let infoOK = '';
    infoOK += `inputs: ${listOOC.length}\n`;
    infoOK += `ok: ${countOK}\n`;
    infoOK += `errors: ${countErrors}\n`;

    await fs.writeFileSync(`${pathOOC}/info.txt`, info);
    await fs.writeFileSync(`${pathOOC}/info-OOC.txt`, infoOOC);
    await fs.writeFileSync(`${pathOOC}/info-inputs-ooc.txt`, infoOK);
}

main();
