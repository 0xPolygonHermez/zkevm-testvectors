/* eslint-disable no-await-in-loop, no-loop-func, no-continue */
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { expect } = require('chai');

const MerkleTreeBridge = require('@polygon-hermez/zkevm-commonjs').MTBridge;
const {
    calculateLeafValue,
} = require('@polygon-hermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('./leafs.json');
const currentOutput = require('../../mt-bridge/claim-vectors.json');

const update = argv.update === true;

describe('mt bridge claim vectors', async function () {
    it('Should check test vectors', async () => {
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
        const output = [];
        for (let i = 0; i < leafs.length; i++) {
            const {
                originalNetwork,
                tokenAddress,
                amount,
                destinationNetwork,
                destinationAddress,
            } = leafs[i];
            const currentLeafValue = calculateLeafValue(originalNetwork, tokenAddress, amount, destinationNetwork, destinationAddress);
            leafs[i].leafValue = currentLeafValue;
            merkleTree.add(currentLeafValue);
        }
        const root = merkleTree.getRoot();
        for (let i = 0; i < leafs.length; i++) {
            const index = i;
            const proof = merkleTree.getProofTreeByIndex(index);
            output[i] = {
                leafs,
                index,
                proof,
                root,
            };
            if (!update) {
                expect(output[i]).to.be.deep.equal(currentOutput[i]);
            }
        }
        if (update) {
            const dir = path.join(__dirname, '../../mt-bridge/claim-vectors.json');
            await fs.writeFileSync(dir, JSON.stringify(output, null, 2));
        }
    });
});
