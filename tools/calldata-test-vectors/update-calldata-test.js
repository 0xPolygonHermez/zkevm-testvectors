/* eslint-disable no-await-in-loop, no-loop-func */
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const testVectors = require('../../test-vector-data/state-transition.json');
const abiPoE = require('./poe-abi.json');

async function main() {
    const iPoE = new ethers.utils.Interface(abiPoE);
    const callDataTestVectors = [];
    const maticAmount = ethers.utils.parseEther('1');

    for (let i = 0; i < testVectors.length; i++) {
        const {
            id,
            txs,
            batchL2Data,
        } = testVectors[i];

        const fullCallData = iPoE.encodeFunctionData('sendBatch', [
            batchL2Data,
            maticAmount,
        ]);

        callDataTestVectors.push({
            id,
            txs,
            batchL2Data,
            maticAmount: maticAmount.toString(),
            fullCallData,
        });
    }
    const dir = path.join(__dirname, './calldata-test-vector.json');
    await fs.writeFileSync(dir, JSON.stringify(callDataTestVectors, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });