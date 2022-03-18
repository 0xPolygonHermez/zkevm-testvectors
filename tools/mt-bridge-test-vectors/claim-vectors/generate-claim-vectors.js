/* eslint-disable no-await-in-loop, no-loop-func, no-continue */
const hre = require('hardhat'); // eslint-disable-line
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { Scalar } = require('ffjavascript');

const MerkleTreeBridge = require('@polygon-hermez/zkevm-commonjs').MTBridge;
const {
    calculateLeafValue,
} = require('@polygon-hermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('../leafs.json');

async function main() {
    const height = 32;
    const merkleTree = new MerkleTreeBridge(height);
    const output = [];
    for (let i = 0; i < leafs.length; i++) {
        const {
            originalNetwork,
            tokenAddress,
            amount,
            destinationNetwork,
            destinationAddress
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
            root
        }
    }
    const dir = path.join(__dirname, './claim-vectors.json');
    await fs.writeFileSync(dir, JSON.stringify(output, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
