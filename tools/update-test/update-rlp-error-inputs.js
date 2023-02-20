/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');

const { contractUtils } = require('@0xpolygonhermez/zkevm-commonjs');

async function main() {
    // path rlp-error inputs
    const pathRlpError = path.join(__dirname, '../../inputs-executor/rlp-error');

    // get general input (invalid tx)
    const pathGeneralInput = path.join(__dirname, '../../inputs-executor/no-data/general_2.json');
    const generalInput = JSON.parse(fs.readFileSync(pathGeneralInput));

    // list all RLP invalid files
    let listTests = fs.readdirSync(pathRlpError);
    listTests = listTests.filter((fileName) => path.extname(fileName) === '.json');

    for (let i = 0; i < listTests.length; i++) {
        const pathTest = path.join(pathRlpError, listTests[i]);
        const inputRLP = JSON.parse(fs.readFileSync(pathTest));

        // overwrite all parameters to new ones expect "batchL2Data", "batchHashData" & "inputHash"
        inputRLP.oldStateRoot = generalInput.oldStateRoot;
        inputRLP.newStateRoot = generalInput.oldStateRoot;

        inputRLP.oldAccInputHash = generalInput.oldAccInputHash;
        inputRLP.newAccInputHash = generalInput.newAccInputHash;

        inputRLP.oldNumBatch = generalInput.oldNumBatch;
        inputRLP.newNumBatch = generalInput.newNumBatch;

        inputRLP.newLocalExitRoot = generalInput.newLocalExitRoot;
        inputRLP.chainID = generalInput.chainID;
        inputRLP.forkID = generalInput.forkID;

        inputRLP.sequencerAddr = generalInput.sequencerAddr;
        inputRLP.globalExitRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
        inputRLP.timestamp = generalInput.timestamp;

        inputRLP.batchHashData = contractUtils.calculateBatchHashData(
            inputRLP.batchL2Data,
        );

        inputRLP.newAccInputHash = contractUtils.calculateAccInputHash(
            inputRLP.oldAccInputHash,
            inputRLP.batchHashData,
            inputRLP.globalExitRoot,
            inputRLP.timestamp,
            inputRLP.sequencerAddr,
        );

        inputRLP.db = generalInput.db;

        fs.writeFileSync(pathTest, JSON.stringify(inputRLP, null, 2));
    }
}

main();
