/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
const fs = require('fs');
const path = require('path');

const removed = [];
/**
 * Script to check if there is some input without virtualCounters param. In this case, it should be regenerated as the test will fail
 */
function main() {
    console.log('Checking ignored tests from inputs');
    const inputsPath = path.join(__dirname, '../../inputs-executor');
    const inputs = fs.readdirSync(inputsPath);
    checkIgnoredTests(inputs, inputsPath);
    console.log(`Removed files: ${removed.join(', ')}`);
    console.log('Finished removing generated ignored inputs');
}

function checkIgnoredTests(files, inputsPath) {
    files.forEach((file) => {
        const newPath = path.join(inputsPath, file);
        if (fs.statSync(newPath).isDirectory() && !file.includes('-ignore')) {
            checkIgnoredTests(fs.readdirSync(newPath), newPath);
        } else if (file.endsWith('.json-ignore') && !file.includes('no-exec')) {
            // Check if the file has a corresponding file without the ignore suffix
            const fileWithoutIgnore = file.replace('-ignore', '');
            const fileWithoutIgnorePath = path.join(inputsPath, fileWithoutIgnore);
            if (fs.existsSync(fileWithoutIgnorePath)) {
                // remove input file
                fs.unlinkSync(fileWithoutIgnorePath);
                removed.push(fileWithoutIgnore);
            }
        }
    });
}

main();
