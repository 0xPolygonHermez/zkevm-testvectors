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

const pathInputs = path.join(__dirname, '../../inputs-executor-blob');

describe('BlobProcessor', async function () {
    let pathBlobTests = path.join(__dirname, "../data/blob");

    let update;
    let geninput;
    let poseidon;
    let F;

    let testVectorsFiles;
    let testVectors;
    let newTestVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        if(typeof argv.test !== 'undefined') {
            testVectorsFiles = [argv.test];
        } else {
            testVectorsFiles = fs.readdirSync(pathBlobTests);            
        }

        update = (argv.update === true);
        geninput = (argv.geninput === true);
    });

    it('Check test vectors', async () => {
        for(let j = 0; j < testVectorsFiles.length; j++) {
            const pathBlobTestsFile = `${pathBlobTests}/${testVectorsFiles[j]}`;
            testVectors = JSON.parse(fs.readFileSync(pathBlobTestsFile))
            console.log(`   Init tests from ${testVectorsFiles[j]}`);
            if(typeof argv.index !== 'undefined') {
                newTestVectors = [testVectors[argv.index]];
            } else {
                newTestVectors = testVectors;
            }
            for (let i = 0; i < newTestVectors.length; i++) {
                let {
                    description,
                    preExecution,
                    inputBlob,
                    batchesData,
                    blobData,
                    expected,
                    forkID
                } = newTestVectors[i];

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
                inputBlob.publics.forkID = forkID;

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
                    const dstFile = path.join(pathInputs, `${path.basename(pathBlobTestsFile, '.json')}-${i}.json`);
                    const folder = path.dirname(dstFile);

                    if (!fs.existsSync(folder)) {
                        fs.mkdirSync(folder);
                    }
                    console.log(`WRITE: ${dstFile}`)
                    await fs.writeFileSync(dstFile, JSON.stringify(inputBlobInner, null, 2));
                    inputBlob.publics.forkID = undefined;
                }

                console.log(`       Completed test ${i + 1}/${testVectors.length}: ${description}`);
            }

            if (update) {
                await fs.writeFileSync(pathBlobTestsFile, JSON.stringify(testVectors, null, 2));
            }
        }   
        
    });
});
