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
    blobInner, getPoseidon,
} = require('@0xpolygonhermez/zkevm-commonjs');

const pathInputData = path.join(__dirname, '../data/blob');

describe('BlobProcessor', async function () {
    this.timeout(100000);

    let update;
    let geninput;
    let poseidon;
    let F;

    let testVectorsFiles;
    let testVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectorsFiles = fs.readdirSync(pathInputData);
    });

    it('Gen test vectors', async () => {
        for(let j = 0; j < testVectorsFiles.length; j++) {
            const pathInputDataFile = `${pathInputData}/${testVectorsFiles[j]}`;
            testVectors = JSON.parse(fs.readFileSync(pathInputDataFile));
            for (let i = 0; i < testVectors.length; i++) {
                const testVector = testVectors[i];
                const inputsTest = testVector.inputsTest;
                if (inputsTest) {
                    testVector.batchesData = [];
                    console.log(`   Init tests from ${testVectorsFiles[j]}`);
                    if(inputsTest.fullBatches) {
                        if(typeof inputsTest.dataBatches === 'undefined' || inputsTest.dataBatches === "") {
                            inputsTest.dataBatches = "0x0b73e6af6f00000000ee80843b9aca00830186a0944d5cf5032b2a844602278b01199ed191a86c93ff88016345785d8a0000808203e880801cee7e01dc62f69a12c3510c6d64de04ee6346d84b6a017f3e786c7d87f963e75d8cc91fa983cd6d9cf55fff80d73bd26cd333b0f098acc1e58edb1fd484ad731bff"
                        }
                        const lengthDataBatch = 4 + (inputsTest.dataBatches.length-2)/2;
                        let bytesblob = 5;
                        console.log(lengthDataBatch)
                        while(bytesblob + lengthDataBatch < blobInner.Constants.MAX_BLOB_DATA_BYTES) {
                            testVector.batchesData.push(inputsTest.dataBatches);
                            bytesblob = bytesblob + lengthDataBatch;
                        }
                        console.log(bytesblob)
                    } else {
                        if(typeof inputsTest.dataBatches === 'undefined' || inputsTest.dataBatches === "") {
                            inputsTest.dataBatches = "0x0b73e6af6f00000000ee80843b9aca00830186a0944d5cf5032b2a844602278b01199ed191a86c93ff88016345785d8a0000808203e880801cee7e01dc62f69a12c3510c6d64de04ee6346d84b6a017f3e786c7d87f963e75d8cc91fa983cd6d9cf55fff80d73bd26cd333b0f098acc1e58edb1fd484ad731bff"
                        }
                        let numBatches = 0;
                        while(numBatches < inputsTest.numBatches) {
                            testVector.batchesData.push(inputsTest.dataBatches);
                            numBatches = numBatches + 1;
                        }
                    }
                }
                const invalidTest = testVector.invalidTest;
                if(invalidTest) {
                    let blobData;
                    if(testVector.batchesData) {
                        const res = blobInner.utils.computeBlobDataFromBatches(testVector.batchesData, testVector.inputBlob.private.blobType);
                        blobData = res.blobData;
                    } else {
                        blobData = testVector.blobData;
                    }
                    if(invalidTest.error === "msb_byte") {
                        console.log("UPDATE MSB BYTE")
                        blobDataNew = blobData.substring(0,2+invalidTest.index*64);
                        blobDataNew += "ff";
                        blobDataNew += blobData.substring(2+invalidTest.index*64+2);
                    }
                    if(invalidTest.error === "change_byte") {
                        console.log("UPDATE BYTE")
                        blobDataNew = blobData.substring(0,2+invalidTest.index*2);
                        blobDataNew += invalidTest.data;
                        blobDataNew += blobData.substring(2+invalidTest.index*2+2);
                    }
                    testVector.batchesData = undefined;
                    testVector.blobData = blobDataNew;
                }
            }
            console.log(`WRITE: ${pathInputDataFile}`);
            await fs.writeFileSync(pathInputDataFile, JSON.stringify(testVectors, null, 2));
        }   
    });
});
