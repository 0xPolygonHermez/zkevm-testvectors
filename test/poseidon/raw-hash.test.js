const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');

const {
    getPoseidon,
} = require('@polygon-hermez/zkevm-commonjs');
const { pathTestVectors } = require('../helpers/helpers');

describe('poseidon', async function () {
    this.timeout(10000);
    const pathGenesis = path.join(pathTestVectors, 'poseidon/raw-hash.json');

    let update;
    let poseidon;
    let testVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectors = JSON.parse(fs.readFileSync(pathGenesis));

        update = argv.update === true;
    });

    it('should check test-vectors', async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const { input, capacity, expectedOutput } = testVectors[i];
            const output = poseidon(input, capacity);

            for (let j = 0; j < expectedOutput.length; j++) {
                if (update) {
                    testVectors[i].expectedOutput[j] = output[j].toString();
                } else {
                    expect(output[j].toString()).to.be.equal(expectedOutput[j]);
                }
            }
        }

        if (update) {
            fs.writeFileSync(pathGenesis, JSON.stringify(testVectors, null, 2));
        }
    });
});
