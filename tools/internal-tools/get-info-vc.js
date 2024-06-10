/* eslint-disable guard-for-in */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs')
    .alias('i', 'input');

async function main() {
    // get file input path from arguments
    const filePath = argv.input.trim();
    if (!filePath) {
        console.error('Please provide the path to the file containing a correct trace data');
        process.exit(1);
    }
    const pathInfo = path.parse(filePath);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // output file
    const outputBasePath = path.join(__dirname, '/output/cardona');
    // create folder if does not exist
    if (!fs.existsSync(outputBasePath)) {
        fs.mkdirSync(outputBasePath);
    }

    // select counter to filter
    // options: "counters": {
    //   "cnt_arith": 0,
    //   "cnt_binary": 2,
    //   "cnt_mem_align": 0,
    //   "cnt_keccak_f": 0,
    //   "cnt_padding_pg": 0,
    //   "cnt_poseidon_g": 93,
    //   "cnt_steps": 54,
    //   "cnt_sha256_hashes": 0
    // }
    //
    const counterToFilter = 'poseidon';

    // get the full trace and its steps
    const { steps } = data.txs[0];
    const finalReport = [];

    // go for each step
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const {
            counters,
        } = step;

        // filter by counterFilter and it should be over 0
        if (counters && counters[counterToFilter] > 0) {
            step.value = counters[counterToFilter];
            finalReport.push(step);
        }
    }

    // sort by counter value
    // save report based on counterfiltered and input name
    const pathReport = path.join(outputBasePath, `${pathInfo.name}-${counterToFilter}.json`);
    fs.writeFileSync(pathReport, JSON.stringify(finalReport, null, 2));
}
main();