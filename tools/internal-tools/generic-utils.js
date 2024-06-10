/* eslint-disable prefer-destructuring */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
const {
    transform, isEqual, isArray, isObject,
} = require('lodash');
const os = require('os');

/**
 * Find difference between two objects
 * @param  {object} origObj - Source object to compare newObj against
 * @param  {object} newObj  - New object with potential changes
 * @return {object} differences
 */
function difference(origObj, newObj) {
    function changes(newObj, origObj) {
        let arrayIndexCounter = 0;

        return transform(newObj, (result, value, key) => {
            if (!isEqual(value, origObj[key])) {
                const resultKey = isArray(origObj) ? arrayIndexCounter++ : key;
                result[resultKey] = (isObject(value) && isObject(origObj[key])) ? changes(value, origObj[key]) : value;
            }
        });
    }

    return changes(newObj, origObj);
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function parseDataStream(returnExec) {
    const resultText = returnExec.stdout;
    const resultLines = resultText.split(os.EOL);

    const cleanLines = [];

    resultLines.forEach((line) => {
        // Remove ANSI color codes
        const cleanLine = line.replace(/\x1B\[\d+m/g, '');

        // Split the line into key and value
        let key;
        let value;

        if (cleanLine.includes('Timestamp') && !cleanLine.includes(' Timestamp')) {
            const timestmap = cleanLine.split(':').map((s) => s.trim());
            key = timestmap[0].trim();
            // eslint-disable-next-line prefer-destructuring
            value = timestmap[3].match(/\(([^)]+)\)/)[1];
        } else {
            [key, value] = cleanLine.split(':').map((s) => s.trim());
        }
        let keyTrim = key.replace(/\.\.\..*/, ''); // Remove trailing dots and spaces
        keyTrim = keyTrim.replace(/[.]/g, '');
        cleanLines.push([keyTrim, value]);
    });

    const resultObject = {
        encodedTxs: [],
    };
    // process all lines
    for (let i = 0; i < cleanLines.length; i++) {
        if (cleanLines[i][0] === 'Encoded') {
            resultObject.encodedTxs[resultObject.encodedTxs.length - 1].encoded = cleanLines[i][1];
        } else if (cleanLines[i][0] === 'Effec Gas Price') {
            resultObject.encodedTxs.push({
                encoded: '',
                effGasPrice: Number(cleanLines[i][1]),
            });
        } else {
            resultObject[cleanLines[i][0]] = cleanLines[i][1];
        }
    }

    return resultObject;
}

module.exports = {
    difference,
    sleep,
    parseDataStream,
};