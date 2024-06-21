const fs = require('fs');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const path = require('path');
const { argv } = require('yargs')
    .alias('n', 'network')
    .alias('t', 'tx')
    .string('tx');

const { rawTxToCustomRawTx, serializeChangeL2Block } = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;
const { Constants, utils } = require('@0xpolygonhermez/zkevm-commonjs');
const { parseDataStream } = require('./generic-utils');
const { ethers } = require('ethers');

async function main() {
    // get network
    const { network } = argv;
    if(!network) {
        throw new Error("no network")
    }

    // Block Tx Num
    const blockNumDefault = 118800;
    const blockNum = (typeof argv.blockNum !== 'undefined') ? argv.blockNum : blockNumDefault;
    console.log('blockNum: ', blockNum);

    // exec data stream tool
    // go run main.go decode-l2block -cfg config/tool.config.toml -l2block 1235
    const execCurrent = await exec(`cd ../../../../zkevm-node/tools/datastreamer && go run main.go decode-l2block -cfg config/tool.config-${network}.toml -l2block ${blockNum}`);
    const resCurrent = parseDataStream(execCurrent);

    const execPrevious = await exec(`cd ../../../../zkevm-node/tools/datastreamer && go run main.go decode-l2block -cfg config/tool.config-${network}.toml -l2block ${blockNum - 1}`);
    const resPrevious = parseDataStream(execPrevious);

    // Build input
    const input = {
        oldStateRoot: resPrevious['State Root'],
        newStateRoot: resCurrent['State Root'],
        oldAccInputHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        newAccInputHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        newLocalExitRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        oldNumBatch: Number(resCurrent['Batch Number']),
        newNumBatch: Number(resCurrent['Batch Number']) + 1,
        chainID: Number(resCurrent['Chain ID']),
        forkID: Number(resCurrent['Fork ID']),
        forcedBlockHashL1: '0x0000000000000000000000000000000000000000000000000000000000000000', // cannot get this param
        batchL2Data: null,
        l1InfoRoot: '0x0000000000000000000000000000000000000000000000000000000000000000', // skip verify it
        timestampLimit: Number(resCurrent.Timestamp), // cannot get this param
        sequencerAddr: resCurrent.Coinbase,
        contractsBytecode: {}, // empty
        txs: [],
        l1InfoTree: {
            skipVerifyL1InfoRoot: true,
        },
    };

    // build batchL2Data
    const changeL2BlockTx = {
        type: Constants.TX_CHANGE_L2_BLOCK,
        deltaTimestamp: Number(resCurrent['Delta Timestamp']),
        indexL1InfoTree: Number(resCurrent['L1 InfoTree Idx']),
    };
    input.txs.push(changeL2BlockTx)
    input.batchL2Data = `0x${serializeChangeL2Block(changeL2BlockTx)}`;

    // build l1InfoTree Object
    if (changeL2BlockTx.indexL1InfoTree !== 0) {
        input.l1InfoTree[changeL2BlockTx.indexL1InfoTree] = {
            globalExitRoot: resCurrent['Global Exit Root'],
            blockHash: resCurrent['L1 Block Hash'],
            timestamp: 0, // cannot get it from data stream. Ig block is present in the data-stream means that it is OK
        };
    }

    // convert rawTx to our custom rawTx
    for (let i = 0; i < resCurrent.encodedTxs.length; i++) {
        const rawTxInfo = resCurrent.encodedTxs[i];
        const finalTxRaw = rawTxToCustomRawTx(rawTxInfo.encoded, utils.valueToHexStr(rawTxInfo.effGasPrice));
        input.txs.push(ethers.utils.parseTransaction(rawTxInfo.encoded)); 
        input.batchL2Data += finalTxRaw.startsWith('0x') ? finalTxRaw.slice(2) : finalTxRaw;
    }

    console.log(`WRITE: ./output/${network}/block-${blockNum}-input.json`);
    await fs.writeFileSync(
        path.join(__dirname, `./output/${network}/block-${blockNum}-input.json`),
        JSON.stringify(input, null, 2),
    );
    console.log(`WRITE: ../../../inputs/block-${blockNum}.json`);
    await fs.writeFileSync(
        path.join(__dirname, `../../../inputs/block-${blockNum}.json`),
        JSON.stringify(input, null, 2),
    );
}

main();