const { calculateBatchHashData } = require("@0xpolygonhermez/zkevm-commonjs").contractUtils;
const fs = require("fs")
const Scalar = require("ffjavascript").Scalar;
const { argv } = require('yargs')

async function main() {
    // Block Tx Num
    const blockNumDefault = 118800;
    const blockNum = (typeof argv.blockNum !== 'undefined') ? argv.blockNum : blockNumDefault;
    console.log('blockNum: ', blockNum);

    const input = require(`./output/cardona/block-${blockNum}-input.json`);
    const { pre, post } = require(`../../../zkevm-proverjs/src/sm/sm_main/logs-verbose/block-${blockNum}-pre-post-state.json`);
    const outputPath = `./output/cardona/block-${blockNum}-testvector.json`;

    const preKeys = Object.keys(pre);
    const genesis = [];
    for ( let i = 0; i < preKeys.length; i++) {
        const key = preKeys[i];
        const account = pre[key];
        genesis.push({
            address: key,
            nonce: account.nonce,
            balance: account.balance,
            bytecode: account.bytecode === "none" ? '' : account.bytecode,
            storage: account.storage,
            hashBytecode: account.hashBytecode,
            hashBytecodeLength: account.hashBytecodeLength
        })
    }

    for ( let i = 0; i < input.txs.length; i++ ) {
        const tx = input.txs[i];
        if(tx.gasPrice && tx.gasPrice.type) {
            tx.gasPrice = Scalar.e(tx.gasPrice.hex, 16).toString();
        }
        if(tx.gasLimit && tx.gasLimit.type) {
            tx.gasLimit = Scalar.e(tx.gasLimit.hex, 16).toString();
        }
        if(tx.value && tx.value.type) {
            tx.value = Scalar.e(tx.value.hex, 16).toString();
        }
        if(tx.v) {
            tx.v = "0x" + Scalar.e(tx.v).toString(16);
        }
    }
    const output = [{
        id: 0,
        description: "block-383933-testvector",
        sequencerAddress: input.sequencerAddr,
        genesis,
        expectedOldRoot: input.oldStateRoot,
        txs: input.txs,
        expectedNewRoot: input.newStateRoot,
        expectedNewLeafs: post,
        newLocalExitRoot: input.newLocalExitRoot,
        batchHashData: calculateBatchHashData(input.batchL2Data),
        batchL2Data: input.batchL2Data,
        chainID: input.chainID,
        oldAccInputHash: input.oldAccInputHash,
        forkID: input.forkID,
        l1InfoRoot: input.l1InfoRoot,
        timestampLimit: input.timestampLimit,
    }]
    console.log(`WRITE: ${outputPath}`);
    await fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
}

main();
