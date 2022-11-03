/* eslint-disable no-await-in-loop, no-loop-func, no-continue */
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
const currentOutput = require('../../mt-bridge/claim-vectors.json');

const update = argv.update === true;

describe('mt bridge claim vectors', async function () {
    it('Should check test vectors', async () => {
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
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
