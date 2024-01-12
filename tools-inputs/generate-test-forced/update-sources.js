/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');

async function main() {
    // update gen-sources
    fs.readdirSync('./gen-sources').forEach((file) => {
        const fileName = `../tools-calldata/generate-test-vectors/${file}`;
        const genVector = require(fileName);
        for (let i = 0; i < genVector.length; i++) {
            const test = genVector[i];
            if (test.sequencerAddress !== '0x9000000000000000000000000000000000000009') { test.sequencerAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; }
            test.chainID = 1001;
            for (let j = 0; j < test.txs.length; j++) {
                const tx = test.txs[j];
                if (tx.chainId) {
                    tx.chainId = 1001;
                }
            }
        }
        fs.writeFileSync(`./gen-sources/${file}`, JSON.stringify(genVector, null, 2));
    });
    // update sources
    const testGeneral = require('../data/no-data/general.json');
    for (let i = 0; i < testGeneral.length; i++) {
        const test = testGeneral[i];
        test.sequencerAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
        test.chainID = 1001;
        for (let j = 0; j < test.txs.length; j++) {
            const tx = test.txs[j];
            if (tx.chainId && tx.chainId !== 3333 & tx.chainId !== 401) {
                tx.chainId = 1001;
            }
        }
    }
    await fs.writeFileSync('./sources/general.json', JSON.stringify(testGeneral, null, 2));
}

main();
