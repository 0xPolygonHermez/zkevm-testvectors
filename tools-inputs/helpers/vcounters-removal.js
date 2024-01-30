/* eslint-disable no-use-before-define */
const fs = require('fs');
const path = require('path');
/**
 * Script to remove virtualCounters param from all inputs. This is a safety check to ensure that all tests have been regenerated correctly.
 * In case we remove the virtualCounters param from the inputs, the test will fail.
 */
function main() {
    const inputsPath = path.join(__dirname, '../../inputs-executor');
    const inputs = fs.readdirSync(inputsPath);
    removeVirtualCountersFromInputs(inputs, inputsPath);
}

function removeVirtualCountersFromInputs(files, inputsPath) {
    files.forEach((file) => {
        const newPath = path.join(inputsPath, file);
        if (fs.statSync(newPath).isDirectory()) {
            removeVirtualCountersFromInputs(fs.readdirSync(newPath), newPath);
        } else if (file.endsWith('.json')) {
            const fileContent = fs.readFileSync(newPath, 'utf8');
            const fileContentJSON = JSON.parse(fileContent);
            if (fileContentJSON.virtualCounters) {
                delete fileContentJSON.virtualCounters;
                fs.writeFileSync(newPath, JSON.stringify(fileContentJSON, null, 2));
            }
        }
    });
}

main();
