const fs = require('fs');
const path = require('path');

const MerkleTreeBridge = require('@polygon-hermez/zkevm-commonjs').MTBridge;
const {
    calculateLeafValue,
} = require('@polygon-hermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('../leafs.json');

async function main() {
    const height = 32;
    const merkleTree = new MerkleTreeBridge(height);
    
    let currentRoot = merkleTree.getRoot();
    const leafArray = [];
    const output = [];

    for (let i = 0; i < leafs.length; i++) {
        const {
            originalNetwork,
            tokenAddress,
            amount,
            destinationNetwork,
            destinationAddress
        } = leafs[i];
        output[i] = {};
        output[i].previousLeafsValues = Array.from(leafArray);
        output[i].currentRoot = currentRoot;
        
        const currentLeafValue = calculateLeafValue(originalNetwork, tokenAddress, amount, destinationNetwork, destinationAddress);
        leafArray.push(currentLeafValue);
        merkleTree.add(currentLeafValue);
        currentRoot = merkleTree.getRoot();

        output[i].newLeaf = {
            originalNetwork,
            tokenAddress,
            amount,
            destinationNetwork,
            destinationAddress,
            currentLeafValue
        };
        output[i].newRoot = currentRoot;
    }
    const dir = path.join(__dirname, './root-vectors.json');
    await fs.writeFileSync(dir, JSON.stringify(output, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
