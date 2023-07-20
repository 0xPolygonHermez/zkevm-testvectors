const { Scalar } = require('ffjavascript');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');

const {
    MemDB, SMT, getPoseidon, smtUtils,
} = require('@0xpolygonhermez/zkevm-commonjs');
const { pathTestVectors } = require('../../tools-inputs/helpers/helpers');

describe('smt-raw', async function () {
    this.timeout(10000);

    const pathRaw = path.join(pathTestVectors, 'merkle-tree/smt-raw.json');

    let update;
    let poseidon;
    let F;
    let testVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectors = JSON.parse(fs.readFileSync(pathRaw));

        update = argv.update === true;
    });

    it('Should check test vectors', async () => {
        // build tree and check root
        for (let i = 0; i < testVectors.length; i++) {
            const {
                keys, values, expectedRoot,
            } = testVectors[i];

            const db = new MemDB(F);
            const smt = new SMT(db, poseidon, poseidon.F);

            expect(keys.length).to.be.equal(values.length);

            let tmpRoot = smt.empty;

            for (let j = 0; j < keys.length; j++) {
                const key = smtUtils.scalar2h4(keys[j]);
                const value = Scalar.e(values[j]);

                const res = await smt.set(tmpRoot, key, value);
                tmpRoot = res.newRoot;
            }

            if (update) {
                testVectors[i].expectedRoot = smtUtils.h4toString(tmpRoot);
            } else {
                expect(smtUtils.h4toString(tmpRoot)).to.be.equal(expectedRoot);
            }
        }

        if (update) {
            fs.writeFileSync(pathRaw, JSON.stringify(testVectors, null, 2));
        }
    });
});
