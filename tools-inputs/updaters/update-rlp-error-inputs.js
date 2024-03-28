/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');

const { blobUtils, Constants, processorUtils } = require('@0xpolygonhermez/zkevm-commonjs');

async function main() {
    // path rlp-error inputs
    const pathRlpError = path.join(__dirname, '../../inputs-executor/rlp-error');

    // get general input (invalid tx)
    const pathGeneralInput = path.join(__dirname, '../../inputs-executor/no-data/general_2.json');
    const generalInput = JSON.parse(fs.readFileSync(pathGeneralInput));

    // list all RLP invalid files
    let listTests = fs.readdirSync(pathRlpError);
    listTests = listTests.filter((fileName) => path.extname(fileName) === '.json');

    // Ethereum test to add by default a changeL2Block transaction
    const txChangeL2Block = {
        type: 11,
        deltaTimestamp: '100000',
        l1Info: {
            globalExitRoot: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
            blockHash: '0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb',
            minTimestamp: '42',
        },
        indexL1InfoTree: 0,
    };

    const rawChangeL2BlockTx = processorUtils.serializeChangeL2Block(txChangeL2Block);

    for (let i = 0; i < listTests.length; i++) {
        const pathTest = path.join(pathRlpError, listTests[i]);
        const inputRLP = JSON.parse(fs.readFileSync(pathTest));

        if (!inputRLP.batchL2Data.startsWith(`0x${rawChangeL2BlockTx}`)) {
            inputRLP.batchL2Data = `0x${rawChangeL2BlockTx}${inputRLP.batchL2Data.slice(2)}`;
        }

        // overwrite all parameters to new ones expect "batchL2Data", "batchHashData" & "inputHash"
        inputRLP.oldStateRoot = generalInput.oldStateRoot;
        inputRLP.newStateRoot = generalInput.oldStateRoot;

        inputRLP.oldBatchAccInputHash = generalInput.oldBatchAccInputHash;
        inputRLP.newBatchAccInputHash = generalInput.newBatchAccInputHash;

        inputRLP.oldNumBatch = generalInput.oldNumBatch;
        inputRLP.newNumBatch = generalInput.newNumBatch;

        inputRLP.newLocalExitRoot = generalInput.newLocalExitRoot;
        inputRLP.chainID = generalInput.chainID;
        inputRLP.forkID = generalInput.forkID;

        inputRLP.sequencerAddr = generalInput.sequencerAddr;
        inputRLP.l1InfoRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
        inputRLP.forcedHashData = Constants.ZERO_BYTES32;
        inputRLP.type = 0;
        inputRLP.newLastTimestamp = 0;
        inputRLP.currentL1InfoTreeIndex = generalInput.currentL1InfoTreeIndex;
        inputRLP.currentL1InfoTreeRoot = generalInput.currentL1InfoTreeRoot;
        inputRLP.batchHashData = await blobUtils.computeBatchL2HashData(
            inputRLP.batchL2Data,
        );

        inputRLP.newBatchAccInputHash = await blobUtils.computeBatchAccInputHash(
            inputRLP.oldBatchAccInputHash,
            inputRLP.batchHashData,
            inputRLP.sequencerAddr,
            inputRLP.forcedHashData,
            inputRLP.type,
        );
        inputRLP.virtualCounters = {
            steps: 8172503,
            arith: 200919,
            binary: 500000,
            memAlign: 200000,
            keccaks: 2200,
            padding: 140000,
            poseidon: 260000,
        };

        inputRLP.db = generalInput.db;

        inputRLP.l1InfoTree = {

        };

        console.log(`WRITE: ${pathTest}`);
        await fs.writeFileSync(pathTest, JSON.stringify(inputRLP, null, 2));
    }
}

main();
