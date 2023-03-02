const fs = require('fs');
const noExec = require('../no-exec.json');

const pathNoExecInfo = '../no-exec-info.json';

async function main() {
    const ignoredFiles = noExec['not-supported'];
    const listIgnoredFiles = [];
    let countTotal = 0;
    for (let i = 0; i < ignoredFiles.length; i++) {
        countTotal += 1;
        const { description } = ignoredFiles[i];
        const index = listIgnoredFiles.map((e) => e.description).indexOf(description);
        if (index === -1) {
            listIgnoredFiles.push({ description, count: 1 });
        } else {
            listIgnoredFiles[index].count += 1;
        }
    }
    for (let j = 0; j < listIgnoredFiles.length; j++) {
        const per = (listIgnoredFiles[j].count / countTotal) * 100;
        listIgnoredFiles[j].percentage = `${per.toFixed(2)}%`;
    }
    await fs.writeFileSync(pathNoExecInfo, JSON.stringify(listIgnoredFiles, null, 2));
}

main();
