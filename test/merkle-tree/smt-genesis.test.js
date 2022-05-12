const { Scalar } = require('ffjavascript');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');

const {
    MemDB, SMT, smtUtils, getPoseidon,
} = require('@polygon-hermez/zkevm-commonjs');
const { pathTestVectors } = require('../helpers/helpers');

describe('smt-genesis', async function () {
    this.timeout(10000);
    const pathGenesis = path.join(pathTestVectors, 'merkle-tree/smt-genesis.json');

    let update;
    let poseidon;
    let F;
    let testVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectors = JSON.parse(fs.readFileSync(pathGenesis));

        update = argv.update === true;
    });

    it('Should check test vectors', async () => {
        // build tree and check root
        for (let i = 0; i < testVectors.length; i++) {
            const { addresses, expectedRoot } = testVectors[i];

            const db = new MemDB(F);
            const smt = new SMT(db, poseidon, poseidon.F);

            let tmpRoot = smt.empty;

            for (let j = 0; j < addresses.length; j++) {
                const { address, balance, nonce } = addresses[j];

                const keyAddress = await smtUtils.keyEthAddrBalance(address);
                const keyNonce = await smtUtils.keyEthAddrNonce(address);

                let auxRes = await smt.set(tmpRoot, keyAddress, Scalar.e(balance));
                auxRes = await smt.set(auxRes.newRoot, keyNonce, Scalar.e(nonce));
                tmpRoot = auxRes.newRoot;
            }

            if (update) {
                testVectors[i].expectedRoot = (smtUtils.h4toScalar(tmpRoot)).toString();
                testVectors[i].expectedRootHex = `0x${(smtUtils.h4toScalar(tmpRoot)).toString(16)}`;
            } else {
                expect((smtUtils.h4toScalar(tmpRoot)).toString()).to.be.equal(expectedRoot);
            }
        }

        if (update) {
            fs.writeFileSync(pathGenesis, JSON.stringify(testVectors, null, 2));
        }
    });
});
