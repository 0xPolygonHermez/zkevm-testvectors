const { readFileSync, writeFileSync } = require('fs');

async function main() {
    const infoPath = './eth-inputs/final-info.txt';
    const tablePath = './eth-inputs/final-table.txt';
    const tablePathTemplate = 'final-table.template.txt';
    let tableText;
    try {
        tableText = readFileSync(tablePathTemplate, 'utf-8');
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
        newTable += `\n${tableCel[0]}|${tableCel[1]}`;
        if (!info[3].includes('ERROR')) {
            const total = tableCel[2].trim();
            const totalNum = info.filter((inf) => inf.includes('Tests: '))[0].replace('Tests: ', '');
            newTable += `|${tableCel[2].replace(total, totalNum)}`;
            const ok = tableCel[3].trim();
            const okNum = info.filter((inf) => inf.includes('Inputs ok: '))[0].replace('Inputs ok: ', '');
            newTable += `|${tableCel[3].replace(ok, okNum)}`;
            const errors = tableCel[4].trim();
            const genErrors = info.filter((inf) => inf.includes('Generation errors: '))[0].replace('Generation errors: ', '');
            const execErrors = info.filter((inf) => inf.includes('Execution errors: '))[0].replace('Execution errors: ', '');
            const errNum = Number(genErrors) + Number(execErrors);
            newTable += `|${tableCel[4].replace(errors, errNum)}`;
            const ignored = tableCel[5].trim();
            const ignoredNum = info.filter((inf) => inf.includes('Not supported: '))[0].replace('Not supported: ', '');
            newTable += `|${tableCel[5].replace(ignored, ignoredNum)}`;
            const cov = tableCel[6].trim();
            const covNum = info.filter((inf) => inf.includes('% coverage: '))[0].replace('% coverage: ', '');
            newTable += `|${tableCel[6].replace(cov, covNum)}|`;
        } else {
            newTable += `|${tableCel[2]}|${tableCel[3]}|${tableCel[4]}|${tableCel[5]}|${tableCel[6]}|`;
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
