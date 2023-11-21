/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');

const { contractUtils, Constants } = require('@0xpolygonhermez/zkevm-commonjs');

const testvectorsGlobalConfig = require('../testvectors.config.json');

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
        inputRLP.forkID = testvectorsGlobalConfig.forkID;

        inputRLP.sequencerAddr = generalInput.sequencerAddr;
        inputRLP.l1InfoRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
        inputRLP.timestampLimit = generalInput.timestampLimit;
        inputRLP.forcedBlockHashL1 = Constants.ZERO_BYTES32;

        inputRLP.batchHashData = contractUtils.calculateBatchHashData(
            inputRLP.batchL2Data,
        );

        inputRLP.newAccInputHash = contractUtils.calculateAccInputHash(
            inputRLP.oldAccInputHash,
            inputRLP.batchHashData,
            inputRLP.l1InfoRoot,
            inputRLP.timestampLimit,
            inputRLP.sequencerAddr,
            inputRLP.forcedBlockHashL1,
        );

        inputRLP.db = generalInput.db;
        console.log(`WRITE: ${pathTest}`);
        await fs.writeFileSync(pathTest, JSON.stringify(inputRLP, null, 2));
    }
}

main();
