const fs = require('fs');

const inputsPath = '../../../inputs-executor/ethereum-tests/GeneralStateTests/';
const noExecAllPath = '../../../tools-inputs/tools-eth/no-exec.json';

async function main() {
    const foldersInputs = fs.readdirSync(inputsPath);
    const noExec = {
        'breaks-computation': [],
        'not-supported': [],
    };
    for (let i = 0; i < foldersInputs.length; i++) {
        const folderPath = `${inputsPath + foldersInputs[i]}`;
        const stats = fs.statSync(`${folderPath}`);
        if (stats.isDirectory()) {
            const noExecFile = fs.readdirSync(folderPath).filter((file) => file.startsWith('no-exec'));
            if (noExecFile[0]) {
                const newExecPath = `${folderPath}/${noExecFile[0]}`;
                const newExecFolder = require(newExecPath);

                const breakComp = newExecFolder['breaks-computation'];
                const noSup = newExecFolder['not-supported'];

                for (let j = 0; j < breakComp.length; j++) {
                    const elem = breakComp[j];
                    if (!(noExec['breaks-computation'].filter((a) => a.name === elem.name).length > 0)) {
                        noExec['breaks-computation'].push(elem);
                    }
                }

                for (let j = 0; j < noSup.length; j++) {
                    const elem = noSup[j];
                    if (!(noExec['not-supported'].filter((a) => a.name === elem.name).length > 0)) {
                        noExec['not-supported'].push(elem);
                    }
                }
            }
        }
        await fs.writeFileSync(noExecAllPath, JSON.stringify(noExec, null, 2));
    }
}

main();
