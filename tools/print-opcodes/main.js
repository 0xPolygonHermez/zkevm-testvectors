const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const Common = require('@ethereumjs/common').default;
const { Chain, Hardfork } = require('@ethereumjs/common');
const { argv } = require('yargs')
    .usage('node main.js -i <path-input> -o <path-output>')
    .help('h')
    .alias('i', 'input')
    .alias('o', 'output');
const { getOpcodesForHF } = require('../../node_modules/@ethereumjs/vm/dist/evm/opcodes/index');
const { nameOpCodes } = require('./utils');

async function main() {
    // setup hardfork
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin });
    const opcodes = getOpcodesForHF(common);

    // load input
    const inputFile = argv.input;
    if (!fs.existsSync(inputFile)) {
        throw Error(`File ${inputFile} does not exist`);
    }

    let data = fs.readFileSync(inputFile, 'utf-8');
    data = data.startsWith('0x') ? data : `0x${data}`;

    if (!ethers.utils.isHexString(data)) {
        throw Error('Data read is not a valid hex string');
    }

    // setup output
    const outputFile = (typeof argv.output === 'undefined') ? path.join(__dirname, 'output.json') : argv.output;

    // print opcodes
    const out = nameOpCodes(Buffer.from(data.slice(2), 'hex'), opcodes);

    // save output
    out.unshift(data);
    fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));
}

main();
