const fs = require('fs');
const { execSync } = require('child_process');
const { argv } = require('process');
const list = require('./tx-max-int.json');

const pathNoExec = '../no-exec.json';
const pathInfo1 = './info-max-int.txt';
const pathInfo2 = './info-max-int2.txt';
const noExec = require(pathNoExec);
const pathFillers = '../tests/src/GeneralStateTestsFiller';

let info1 = '';
let info2 = '';

async function main() {
    if (argv.copy) { await fs.copyFileSync(pathNoExec, '../no-exec-copy.json'); }
    let newNoExec = noExec;
    let auxNewNoExec;
    for (let i = 0; i < list.length; i++) {
        const name = list[i].replace('.json', '');
        const file = name.split('/')[name.split('/').length - 1];
        let file2 = file;
        const folder = name.replace(`/${file2}`, '');
        let filler;
        auxNewNoExec = newNoExec['not-supported'].filter((elem) => elem.name !== name);
        if (name.includes('VMTests')) {
            auxNewNoExec = newNoExec['not-supported'].filter((elem) => !elem.name.includes(file2));
        }
        await fs.writeFileSync(pathNoExec, JSON.stringify({
            'breaks-computation': noExec['breaks-computation'],
            'not-supported': auxNewNoExec,
        }, null, 2));
        try {
            console.log(`${pathFillers}/${folder}/${file2}Filler.json`);
            filler = require(`${pathFillers}/${folder}/${file2}Filler.json`);
            filler[file2].env.currentGasLimit = '0x7fffffff';
            await fs.writeFileSync(`${pathFillers}/${folder}/${file2.replace('.json', '')}Filler.json`, JSON.stringify(filler, null, 2));
        } catch (e) {
            console.log(e);
            if (e.toString().includes('Cannot find module')) {
                const aux = file2.split('_');
                aux.pop();
                file2 = aux.join('_');
                try {
                    console.log(`${pathFillers}/${folder}/${file2}Filler.json`);
                    console.log('zkevm-testvectors/tools/ethereum-tests/tests/src/GeneralStateTestsFiller/stPreCompiledContracts2/CALLBlake2fFiller.json');
                    filler = require(`${pathFillers}/${folder}/${file2}Filler.json`);
                    filler[file2].env.currentGasLimit = '0x7fffffff';
                    await fs.writeFileSync(`${pathFillers}/${folder}/${file2}Filler.json`, JSON.stringify(filler, null, 2));
                } catch (e2) {
                    console.log(e2);
                    console.log(`${pathFillers}/${folder}/${file2}Filler.yml`);
                    filler = fs.readFileSync(`${pathFillers}/${folder}/${file2}Filler.yml`, 'utf8');
                    let indNum = filler.search('currentGasLimit:');
                    while (filler.substring(indNum, indNum + 1) !== ' ') {
                        indNum += 1;
                    }
                    indNum += 1;
                    let indNum2 = indNum;
                    while (filler.substring(indNum2, indNum2 + 1) !== ' ') {
                        indNum2 += 1;
                    }
                    const currentGasLimit = filler.substring(indNum, indNum2 - 1);
                    filler = filler.replace(`currentGasLimit: ${currentGasLimit}`, 'currentGasLimit: 0x7fffffff');
                    // console.log(`${pathFillers}/${folder}/${file2}Filler.yml`);
                    await fs.writeFileSync(`${pathFillers}/${folder}/${file2}Filler.yml`, filler);
                }
            }
        }
        try {
            // console.log(`cd ../ && ./test-filler.sh ${folder} ${file2}`);
            const res = await execSync(`cd ../ && ./test-filler.sh ${folder} ${file2}`);
            if (res.toString().includes('Error: not supported')) {
                throw new Error('Total Tests Run: 0');
            }
            info1 += `OK: ${folder}/${file}\n`;
            newNoExec = {
                'breaks-computation': noExec['breaks-computation'],
                'not-supported': auxNewNoExec,
            };
            await fs.writeFileSync(pathInfo1, info1);
        } catch (e) {
            console.log(e);
            info2 += `Fail Generation 1: ${folder}/${file}\n`;
            await fs.writeFileSync(pathInfo2, info2);
        }
    }
    // await fs.writeFileSync(pathNoExec, JSON.stringify(noExec, null, 2));
}

main();
