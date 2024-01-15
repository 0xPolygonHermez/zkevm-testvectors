/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');

const listStateOverride = [
    {
        fileNameInput: '../../inputs-executor/no-data/chain-ids_0.json',
        fileNameOutput: '../../inputs-executor/special-inputs/stateoverride-inputs/chainId.json',
        stateOverride: {
            '0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D': {
                balance: '200000000000000000000',
                nonce: 0,
            },
        },
    },

];

async function main() {
    for (let i = 0; i < listStateOverride.length; i++) {
        const objectTest = listStateOverride[i];
        const test = require(objectTest.fileNameInput);
        test.stateOverride = objectTest.stateOverride;
        await fs.writeFileSync(objectTest.fileNameOutput, JSON.stringify(test, null, 2));
    }
}

main();
