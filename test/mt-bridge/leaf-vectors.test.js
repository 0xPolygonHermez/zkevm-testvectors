const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { expect } = require('chai');
const { ethers } = require('ethers');

const {
    getLeafValue,
} = require('@polygon-hermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('./leafs.json');
const currentOutput = require('../../mt-bridge/leaf-vectors.json');

const update = argv.update === true;

describe('mt bridge leaf vectors', async function () {
    it('Should check test vectors', async () => {
        for (let i = 0; i < leafs.length; i++) {
            const {
                originNetwork,
                tokenAddress,
                amount,
                destinationNetwork,
                destinationAddress,
                metadata,
            } = leafs[i];
            const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);
            const currentLeafValue = getLeafValue(
                originNetwork,
                tokenAddress,
                destinationNetwork,
                destinationAddress,
                amount,
                metadataHash,
            );
            leafs[i].leafValue = currentLeafValue;
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
