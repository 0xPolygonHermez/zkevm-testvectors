const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { expect } = require('chai');
const { ethers } = require('ethers');

const MerkleTreeBridge = require('@0xpolygonhermez/zkevm-commonjs').MTBridge;
const {
    getLeafValue,
} = require('@0xpolygonhermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('./leafs.json');
const currentOutput = require('../../mt-bridge/root-vectors.json');

const update = argv.update === true;

describe('mt bridge root vectors', async function () {
    it('Should check test vectors', async () => {
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);

        let currentRoot = merkleTree.getRoot();
        const output = [];

        for (let i = 0; i < leafs.length; i++) {
            const {
                leafType,
                originNetwork,
                tokenAddress,
                amount,
                destinationNetwork,
                destinationAddress,
                metadata,
            } = leafs[i];
            output[i] = {};
            output[i].previousLeafsValues = Array.from(merkleTree.tree[0]);
            output[i].currentRoot = currentRoot;

            const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);
            const currentLeafValue = getLeafValue(
                leafType,
                originNetwork,
                tokenAddress,
                destinationNetwork,
                destinationAddress,
                amount,
                metadataHash,
            );
            merkleTree.add(currentLeafValue);
            currentRoot = merkleTree.getRoot();

            output[i].newLeaf = {
                originNetwork,
                tokenAddress,
                amount,
                destinationNetwork,
                destinationAddress,
                currentLeafValue,
                metadata,
            };
            output[i].newRoot = currentRoot;
            if (!update) {
                expect(output[i]).to.be.deep.equal(currentOutput[i]);
            }
        }
        if (update) {
            const dir = path.join(__dirname, '../../mt-bridge/root-vectors.json');
            await fs.writeFileSync(dir, JSON.stringify(output, null, 2));
        }
    });
});
