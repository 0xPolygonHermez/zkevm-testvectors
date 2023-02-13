/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const path = require('path');

const dir = './eth-inputs';
const { argv } = require('yargs');

async function main() {
    const pathFolder = path.join(__dirname, dir);
    const filesDirec = fs.readdirSync(pathFolder);
    let files = 0;
    let tests = 0;
    let inputs = 0;
    let ok = 0;
    let errExec = 0;
    let errGen = 0;
    let notSup = 0;
    const objectFolders = {};
    await fs.writeFileSync('eth-inputs/final-info.txt', '');
    await fs.writeFileSync('eth-inputs/final.txt', '');
    for (let i = 0; i < filesDirec.length; i++) {
        const path1 = `${pathFolder}/${filesDirec[i]}`;
        const stats = fs.statSync(path1);
        if (stats.isDirectory()) {
            const filesDirec2 = fs.readdirSync(`${path1}`);
            for (let j = 0; j < filesDirec2.length; j++) {
                const path2 = `${path1}/${filesDirec2[j]}`;
                const pathInfo = `${path2}/info.txt`;
                const pathInfoInputs = `${path2}/info-inputs.txt`;
                const pathInfoInputsOOC = `${path2}/info-inputs-ooc.txt`;
                const pathInfoInputs30M = `${path2}/info-30M.txt`;
                if (fs.existsSync(pathInfo) && fs.existsSync(pathInfoInputs) && !fs.existsSync(pathInfoInputs30M)) {
                    const fileInfo = fs.readFileSync(pathInfo, 'utf8');
                    const fileLines = fileInfo.split('\n');
                    const files2 = Number(fileLines[0].replace('files: ', ''));
                    const tests2 = Number(fileLines[1].replace('tests: ', ''));
                    const inputs2 = Number(fileLines[2].replace('inputs: ', ''));
                    const errGen2 = Number(fileLines[3].replace('errors: ', ''));
                    const notSup2 = Number(fileLines[4].replace('not-supported: ', ''));
                    const fileInfoInputs = fs.readFileSync(pathInfoInputs, 'utf8');
                    const fileInputsLines = fileInfoInputs.split('\n');
                    const ok2 = Number(fileInputsLines[1].replace('ok: ', ''));
                    const errExec2 = Number(fileInputsLines[2].replace('errors: ', ''));
                    files += files2;
                    tests += tests2;
                    inputs += inputs2;
                    ok += ok2;
                    errExec += errExec2;
                    errGen += errGen2;
                    notSup += notSup2;
                    objectFolders[path2.split('/')[path2.split('/').length - 1]] = {
                        files2, tests2, inputs2, ok2, errExec2, errGen2, notSup2,
                    };
                } else if (fs.existsSync(pathInfo) && fs.existsSync(pathInfoInputsOOC)) {
                    const listOOC = require(`${path2}/testsOOC-list.json`);
                    const list30M = require(`${path2.replace('tests-OOC', 'tests-30M')}/tests30M-list.json`);
                    for (let x = 0; x < listOOC.length; x++) {
                        const { fileName, passed } = listOOC[x];
                        let folderTest = fileName.split('/')[fileName.split('/').length - 2];
                        if (folderTest.includes('tests-30M')) {
                            // console.log(fileName);
                            const elem = list30M.filter((e) => e.writeOutputName === fileName)[0];
                            folderTest = elem.file.split('/')[elem.file.split('/').length - 2];
                            if (folderTest.includes('VMTests')) {
                                folderTest = elem.file.split('/')[elem.file.split('/').length - 3];
                            }
                        }
                        objectFolders[folderTest].tests2 += 1;
                        objectFolders[folderTest].inputs2 += 1;
                        if (passed) {
                            objectFolders[folderTest].ok2 += 1;
                            ok += 1;
                            objectFolders[folderTest].errExec2 -= 1;
                            errExec -= 1;
                        }
                    }
                } else if (fs.existsSync(pathInfo) && fs.existsSync(pathInfoInputs30M)) {
                    const list = require(`${path2}/tests30M-list.json`);
                    for (let x = 0; x < list.length; x++) {
                        const { file, passed } = list[x];
                        let folderTest = file.split('/')[file.split('/').length - 2];
                        if (file.includes('VMTests')) {
                            folderTest = file.split('/')[file.split('/').length - 3];
                        }
                        objectFolders[folderTest].tests2 += 1;
                        objectFolders[folderTest].inputs2 += 1;
                        tests += 1;
                        inputs += 1;
                        if (passed) {
                            objectFolders[folderTest].ok2 += 1;
                            ok += 1;
                        } else {
                            objectFolders[folderTest].errExec2 += 1;
                            errExec += 1;
                        }
                    }
                } else {
                    await fs.appendFileSync('eth-inputs/final-info.txt', `Test ${path2}\n`, 'utf8', () => {});
                    await fs.appendFileSync('eth-inputs/final-info.txt', 'ERROR ****************************\n', 'utf8', () => {});
                    await fs.appendFileSync('eth-inputs/final-info.txt', '_______________________________________________________________________________\n', 'utf-8', () => {});
                }
            }
        }
    }

    for (const key in objectFolders) {
        let errGenPerc;
        let errExecPerc;
        let okPerc;
        let covPerc;
        const {
            files2, tests2, inputs2, ok2, errExec2, errGen2, notSup2,
        } = objectFolders[key];
        if (tests2 === 0) {
            errGenPerc = 0;
            errExecPerc = 0;
            okPerc = 0;
        } else {
            errGenPerc = (100 * (errGen2 / tests2)).toFixed(2);
            errExecPerc = (100 * (errExec2 / tests2)).toFixed(2);
            okPerc = (100 * (ok2 / tests2)).toFixed(2);
        }
        if (tests2 - notSup2 === 0) {
            covPerc = (100).toFixed(2);
        } else {
            covPerc = (100 * ok2 / (tests2 - notSup2)).toFixed(2);
        }

        fs.appendFileSync('eth-inputs/final-info.txt', `Test ${key}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Files: ${files2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Tests: ${tests2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Inputs: ${inputs2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Generation errors: ${errGen2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Inputs ok: ${ok2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Execution errors: ${errExec2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `Not supported: ${notSup2}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `% pass correctly: ${okPerc}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `% generation errors: ${errGenPerc}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `% execution errors: ${errExecPerc}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', `% coverage: ${covPerc}\n`, 'utf8', () => {});
        fs.appendFileSync('eth-inputs/final-info.txt', '_______________________________________________________________________________\n', 'utf-8', () => {});
    }
    const p1 = (100 * (errGen / tests)).toFixed(2);
    const p2 = (100 * (errExec / tests)).toFixed(2);
    const p3 = (100 * (ok / tests)).toFixed(2);
    const p4 = (100 * (notSup / tests)).toFixed(2);
    const p5 = (100 * (ok / (tests - notSup))).toFixed(2);

    await fs.appendFileSync('eth-inputs/final.txt', `Commit ethereum/tests: ${argv.commit_eth_tests} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Commit zkevm-testvectors: ${argv.commit_testvectors} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Commit zkevm-rom: ${argv.commit_rom} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Commit zkevm-proverjs: ${argv.commit_proverjs} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Files: ${files} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Total tests: ${tests} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Generation errors: ${errGen}\n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Inputs: ${inputs} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Inputs ok: ${ok} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Exec errors: ${errExec} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Not supported: ${notSup} \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', '-----------------------------\n', 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', 'Tests: 100% \n', 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Tests ok: ${p3}% \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Exec Error: ${p2}%\n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Generation Error: ${p1}%  \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Not supported: ${p4}% \n`, 'utf8', () => {});
    await fs.appendFileSync('eth-inputs/final.txt', `Coverage: ${p5}% \n`, 'utf8', () => {});
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
