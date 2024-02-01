/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
const fs = require('fs');
const path = require('path');
/**
 * Script to check if there is some input without virtualCounters param. In this case, it should be regenerated as the test will fail
 */
function main() {
    console.log('Checking virtualCounters from inputs');
    const inputsPath = path.join(__dirname, '../../inputs-executor');
    const inputs = fs.readdirSync(inputsPath);
    checkVirtualCountersFromInputs(inputs, inputsPath);
    console.log('Finished checking virtualCounters from inputs');
}

function checkVirtualCountersFromInputs(files, inputsPath) {
    files.forEach((file) => {
        const newPath = path.join(inputsPath, file);
        if (fs.statSync(newPath).isDirectory() && !file.includes('-ignore')) {
            checkVirtualCountersFromInputs(fs.readdirSync(newPath), newPath);
        } else if (file.endsWith('.json') && !file.includes('no-exec')) {
            const fileContent = fs.readFileSync(newPath, 'utf8');
            const fileContentJSON = JSON.parse(fileContent);
            if (typeof fileContentJSON.virtualCounters === 'undefined') {
                console.log(`virtualCounters not found in ${file}`);
            }
        }
    });
}

main();
