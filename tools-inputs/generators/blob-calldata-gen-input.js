/* eslint-disable no-continue */
/* eslint-disable prefer-const */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */

const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const { expect } = require('chai');

const {
    blobInner, MemDB, SMT, getPoseidon, smtUtils, Constants, stateUtils,
} = require('@0xpolygonhermez/zkevm-commonjs');

const pathInputs = path.join(__dirname, '../../inputs-executor-blob/calldata');

describe('BlobProcessor', async function () {
    this.timeout(100000);

    let pathBlobTests = path.join(__dirname, "../data/blob/blob-inner-data.json");

    let update;
    let geninput;
    let poseidon;
    let F;

    let testVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectors = JSON.parse(fs.readFileSync(pathBlobTests));

        update = (argv.update === true);
        geninput = (argv.geninput === true);
    });

    it('Check test vectors', async () => {
        for (let i = 0; i < testVectors.length; i++) {
            let {
                description,
                preExecution,
                inputBlob,
                batchesData,
                blobData,
                expected,
            } = testVectors[i];

            const db = new MemDB(F);

            // PreExecution
            // Add localExitRoot to the DB
            const smt = new SMT(db, poseidon, poseidon.F);

            // Update smt with the new timestamp
            const oldStateRoot = await stateUtils.setContractStorage(
                Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2,
                smt,
                [F.zero, F.zero, F.zero, F.zero],
                { [Constants.LOCAL_EXIT_ROOT_STORAGE_POS]: preExecution.initLocalExitRoot },
            );
            // add oldStateRoot to publics
            inputBlob.publics.oldStateRoot = smtUtils.h4toString(oldStateRoot);

            // parse inputs
            const inPublics = blobInner.parsers.parseGlobalInputs(inputBlob.publics);
            const inPrivates = blobInner.parsers.parsePrivateInputs(inputBlob.private);

            // create blobProicessor instance
            const blobInnerProcessor = new blobInner.Processor(
                db,
                poseidon,
                inPublics,
                inPrivates,
            );

            // either batchData or blobData. Not both allowed
            if (!(typeof batchesData === 'undefined' ^ typeof blobData === 'undefined')) {
                throw new Error('Only one batchData or blobData should be defined');
            }

            if (typeof batchesData !== 'undefined') {
                for (let j = 0; j < batchesData.length; j++) {
                    // add batchData to blobProcessor
                    const batchData = batchesData[j];
                    await blobInnerProcessor.addBatchL2Data(batchData);
                }
            }

            if (typeof blobData !== 'undefined') {
                // add blobData to blobProcessor
                await blobInnerProcessor.addBlobData(blobData);
            }

            // build blobInner
            await blobInnerProcessor.execute();

            // get stark input
            const inputBlobInner = await blobInnerProcessor.getStarkInput();
            // check expected result
            if (!update) {
                expect(expected.newBlobStateRoot).to.be.equal(inputBlobInner.newBlobStateRoot);
                expect(expected.newBlobAccInputHash).to.be.equal(inputBlobInner.newBlobAccInputHash);
                expect(expected.newNumBlob).to.be.equal(inputBlobInner.newNumBlob);
                expect(expected.finalAccBatchHashData).to.be.equal(inputBlobInner.finalAccBatchHashData);
                expect(expected.localExitRootFromBlob).to.be.equal(inputBlobInner.localExitRootFromBlob);
                expect(expected.isInvalid).to.be.equal(inputBlobInner.isInvalid);
            } else {
                // update expected
                expected.newBlobStateRoot = inputBlobInner.newBlobStateRoot;
                expected.newBlobAccInputHash = inputBlobInner.newBlobAccInputHash;
                expected.newNumBlob = inputBlobInner.newNumBlob;
                expected.finalAccBatchHashData = inputBlobInner.finalAccBatchHashData;
                expected.localExitRootFromBlob = inputBlobInner.localExitRootFromBlob;
                expected.isInvalid = inputBlobInner.isInvalid;
            }

            if (update && geninput) {
                const dstFile = path.join(pathInputs, `${path.basename(pathBlobTests, '.json')}-${i}-input.json`);
                const folder = path.dirname(dstFile);

                if (!fs.existsSync(folder)) {
                    fs.mkdirSync(folder);
                }

                await fs.writeFileSync(dstFile, JSON.stringify(inputBlobInner, null, 2));
            }

            console.log(`       Completed test ${i + 1}/${testVectors.length}: ${description}`);
        }

        if (update) {
            await fs.writeFileSync(pathBlobTests, JSON.stringify(testVectors, null, 2));
        }
    });
});
