const { readFileSync, writeFileSync } = require('fs');

async function main() {
    const infoPath = './eth-inputs/final-info.txt';
    const tablePath = 'final-table.txt';
    let tableText;
    try {
        tableText = readFileSync(tablePath, 'utf-8');
    } catch (e) {
        throw new Error("'final-table.txt' file does not exist");
    }
    const tableRows = tableText.split('\n');
    let fileText;
    try {
        fileText = readFileSync(infoPath, 'utf-8');
    } catch (e) {
        throw new Error("'./eth-inputs/final-info.txt' file does not exist");
    }
    const infos = fileText.split('_______________________________________________________________________________');
    let newTable = `${tableRows[0]}\n${tableRows[1]}`;
    for (let i = 2; i < tableRows.length; i++) {
        const tableCel = tableRows[i].split('|');
        const name = tableCel[1].trim();
        const info = infos.filter((inf) => inf.includes(name))[0].split('\n');
        newTable += `\n${tableCel[0]}|${tableCel[1]}|${tableCel[2]}|${tableCel[3]}|${tableCel[4]}`;
        if (!info[3].includes('ERROR')) {
            const total = tableCel[5].trim();
            const totalNum = info.filter((inf) => inf.includes('Tests: '))[0].replace('Tests: ', '');
            newTable += `|${tableCel[5].replace(total, totalNum)}`;
            const ok = tableCel[6].trim();
            const okNum = info.filter((inf) => inf.includes('Inputs ok: '))[0].replace('Inputs ok: ', '');
            newTable += `|${tableCel[6].replace(ok, okNum)}`;
            const errors = tableCel[7].trim();
            const genErrors = info.filter((inf) => inf.includes('Generation errors: '))[0].replace('Generation errors: ', '');
            const execErrors = info.filter((inf) => inf.includes('Execution errors: '))[0].replace('Execution errors: ', '');
            const errNum = Number(genErrors) + Number(execErrors);
            newTable += `|${tableCel[7].replace(errors, errNum)}`;
            const ignored = tableCel[8].trim();
            const ignoredNum = info.filter((inf) => inf.includes('Not supported: '))[0].replace('Not supported: ', '');
            newTable += `|${tableCel[8].replace(ignored, ignoredNum)}`;
            const cov = tableCel[9].trim();
            const covNum = info.filter((inf) => inf.includes('% coverage: '))[0].replace('% coverage: ', '');
            newTable += `|${tableCel[9].replace(cov, covNum)}|`;
        } else {
            newTable += `|${tableCel[5]}|${tableCel[6]}|${tableCel[7]}|${tableCel[8]}|${tableCel[9]}|`;
        }
    }
    await writeFileSync(tablePath, newTable);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
