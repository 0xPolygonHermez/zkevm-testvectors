/* eslint-disable no-await-in-loop, no-loop-func, no-continue */
const hre = require('hardhat'); // eslint-disable-line
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { Scalar } = require('ffjavascript');

const testVectors = require('../../test/src/zk-EVM/helpers/test-vector-data/state-transition.json');

function toHexString(num) {
    let numHex;
    if (typeof num === 'number') {
        numHex = Scalar.toString(Scalar.e(num), 16);
        // if it's an integer and it's value is 0, the standar is set to 0x, instead of 0x00 ( because says that always is codified in the shortest way)
        if (Scalar.e(num) === Scalar.e(0)) return '0x';
    } else if (typeof num === 'string') {
        numHex = num.startsWith('0x') ? num.slice(2) : num;
    }
    numHex = (numHex.length % 2 === 1) ? (`0x0${numHex}`) : (`0x${numHex}`);
    return numHex;
}

function calculateBlockHash(
    parentHash,
    coinbase,
    root,
    txHash,
    receiptHash,
    number,
    gasLimit,
    gasUsed,
    time,
    extra,
    mixDigest,
    nonce,
    uncleHash,
    bloom,
    difficulty,
) {
    const rlpEncodedBlock = ethers.utils.RLP.encode([
        parentHash,
        uncleHash,
        coinbase,
        root,
        txHash,
        receiptHash,
        bloom,
        toHexString(difficulty),
        toHexString(number),
        toHexString(gasLimit),
        toHexString(gasUsed),
        toHexString(time),
        extra,
        mixDigest,
        nonce,
    ]);
    return ethers.utils.keccak256(rlpEncodedBlock);
}

// Constants

async function main() {
    // deploy proof of efficiency

    for (let i = 0; i < testVectors.length; i++) {
        const {
            txs,
            expectedNewRoot,
            sequencerAddress,
        } = testVectors[i];

        const currentTestVector = testVectors[i];

        // For matching the interface in go, some parameters has some predertermined byte length:
        const hashByteLen = 32;
        const bloomByteLen = 256;
        const nonceByteLen = 8;

        // Hardcoded parameters
        const blockNumber = 0;
        const gasUsedForTx = 21000;
        const blockGasLimit = 30000000;
        const parentHash = `0x${Scalar.e(0).toString(16).padStart(hashByteLen * 2, '0')}`;

        // Test case parameters:
        const newRootHex = `0x${Scalar.e(expectedNewRoot).toString(16).padStart(hashByteLen * 2, '0')}`;
        // sequencerAddress: is already well codified

        // TODO parameters
        const txHashRoot = `0x${Scalar.e(0).toString(16).padStart(hashByteLen * 2, '0')}`;
        const receiptRoot = `0x${Scalar.e(0).toString(16).padStart(hashByteLen * 2, '0')}`;
        const time = 0;
        const bloom = `0x${Scalar.e(0).toString(16).padStart(bloomByteLen * 2, '0')}`;
        const extra = '0x'; // no predefined bytes

        // POW related parameters
        const mixDigest = `0x${Scalar.e(0).toString(16).padStart(hashByteLen * 2, '0')}`;
        const nonce = `0x${Scalar.e(0).toString(16).padStart(nonceByteLen * 2, '0')}`;
        const uncleHash = `0x${Scalar.e(0).toString(16).padStart(hashByteLen * 2, '0')}`;
        const difficulty = 0;

        const receiptArray = [];

        for (let j = 0; j < txs.length; j++) {
            const tx = txs[j];
            if (tx.encodeInvalidData === true || tx.rawTx === undefined || tx.reason !== '') {
                continue;
            }

            const receipt = {
                transactionHash: ethers.utils.keccak256(tx.rawTx),
                transactionIndex: receiptArray.length,
                blockNumber,
                from: tx.from,
                to: tx.to,
                cumulativeGasUsed: gasUsedForTx * (receiptArray.length + 1),
                gasUsedForTx,
                contractAddress: null,
                logs: 0,
                logsBloom: 0,
                status: 1,
            };

            receiptArray.push({
                txId: tx.id,
                receipt,
            });
        }
        currentTestVector.receipts = receiptArray;
        currentTestVector.blockInfo = {
            blockNumber,
            gasUsedForTx,
            blockGasLimit,
            parentHash,
            txHashRoot,
            receiptRoot,
        };

        const gasUsed = gasUsedForTx * (receiptArray.length);
        const blockHash = calculateBlockHash(
            parentHash,
            sequencerAddress,
            newRootHex,
            txHashRoot,
            receiptRoot,
            blockNumber,
            blockGasLimit,
            gasUsed,
            time,
            extra,
            mixDigest,
            nonce,
            uncleHash,
            bloom,
            difficulty,
        );

        for (let j = 0; j < receiptArray.length; j++) {
            receiptArray[j].receipt.blockHash = blockHash;
        }
    }
    const dir = path.join(__dirname, './receipt-vector.json');
    await fs.writeFileSync(dir, JSON.stringify(testVectors, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
