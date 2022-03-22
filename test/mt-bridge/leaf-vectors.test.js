const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { expect } = require('chai');

const {
    calculateLeafValue,
} = require('@polygon-hermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('./leafs.json');
const currentOutput = require('../../mt-bridge/leaf-vectors.json');

const update = argv.update === true;

describe('mt bridge leaf vectors', async function () {
    it('Should check test vectors', async () => {
        for (let i = 0; i < leafs.length; i++) {
            const {
                originalNetwork,
                tokenAddress,
                amount,
                destinationNetwork,
                destinationAddress,
            } = leafs[i];
            leafs[i].leafValue = calculateLeafValue(originalNetwork, tokenAddress, amount, destinationNetwork, destinationAddress);
            if (!update) {
                expect(leafs[i]).to.be.deep.equal(currentOutput[i]);
            }
        }
        if (update) {
            const dir = path.join(__dirname, '../../mt-bridge/leaf-vectors.json');
            await fs.writeFileSync(dir, JSON.stringify(leafs, null, 2));
        }
    });
});
