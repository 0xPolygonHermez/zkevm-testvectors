const fs = require('fs');
const path = require('path');

const { contractUtils } = require('@polygon-hermez/zkevm-commonjs');

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
        inputRLP.newStateRoot = generalInput.newStateRoot;
        inputRLP.chainId = generalInput.chainId;
        inputRLP.db = generalInput.db;
        inputRLP.sequencerAddr = generalInput.sequencerAddr;
        inputRLP.oldLocalExitRoot = generalInput.oldLocalExitRoot;
        inputRLP.newLocalExitRoot = generalInput.newLocalExitRoot;
        inputRLP.globalExitRoot = generalInput.globalExitRoot;
        inputRLP.numBatch = generalInput.numBatch;
        inputRLP.timestamp = generalInput.timestamp;
        inputRLP.contractsBytecode = generalInput.contractsBytecode;

        inputRLP.batchHashData = contractUtils.calculateBatchHashData(
            inputRLP.batchL2Data,
            inputRLP.globalExitRoot,
            inputRLP.timestamp,
            inputRLP.sequencerAddr,
            inputRLP.chainId,
            inputRLP.numBatch,
        );

        inputRLP.inputHash = contractUtils.calculateStarkInput(
            inputRLP.oldStateRoot,
            inputRLP.oldLocalExitRoot,
            inputRLP.newStateRoot,
            inputRLP.newLocalExitRoot,
            inputRLP.batchHashData,
        );
        delete inputRLP.keys;

        fs.writeFileSync(pathTest, JSON.stringify(inputRLP, null, 2));
    }
}

main();
