const fs = require('fs');
const path = require('path');

const {
    calculateLeafValue,
} = require('@polygon-hermez/zkevm-commonjs').mtBridgeUtils;

const leafs = require('../leafs.json');

async function main() {
    for (let i = 0; i < leafs.length; i++) {
        const {
            originalNetwork,
            tokenAddress,
            amount,
            destinationNetwork,
            destinationAddress
        } = leafs[i];
        leafs[i].leafValue = calculateLeafValue(originalNetwork, tokenAddress, amount, destinationNetwork, destinationAddress);
    }
    const dir = path.join(__dirname, './leaf-vectors.json');
    await fs.writeFileSync(dir, JSON.stringify(leafs, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
