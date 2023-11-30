/* eslint-disable no-continue */
/* eslint-disable no-loop-func */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const { Scalar } = require('ffjavascript');

const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const fs = require('fs');
const path = require('path');
const helpers = require('../../../tools-inputs/helpers/helpers');
const testvectorsGlobalConfig = require('../../../tools-inputs/testvectors.config.json');
// load list test-vectors

const folderStateTransition = path.join(__dirname, '../../../tools-inputs/data/calldata');
let listTests = fs.readdirSync(folderStateTransition);
listTests = listTests.filter((fileName) => path.extname(fileName) === '.json');

describe('Run state-transition tests: calldata', async function () {
    this.timeout(80000);
    let poseidon;
    let F;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    for (let m = 0; m < listTests.length; m++) {
        it(`check test vectors: ${listTests[m]}`, async () => {
            const pathTestVector = path.join(folderStateTransition, listTests[m]);
            const testVectors = JSON.parse(fs.readFileSync(pathTestVector));
            const testName = listTests[m];
            for (let i = 0; i < testVectors.length; i++) {
                if (!pathTestVector.includes('change-l2-block')) continue;
                console.log(`check test vectors: ${pathTestVector}`);
                console.log(`check test vectors: ${testVectors[i].id}`);
                let {
                    genesis,
                    expectedOldRoot,
                    txs,
                    expectedNewRoot,
                    sequencerAddress,
                    expectedNewLeafs,
                    oldAccInputHash,
                    l1InfoRoot,
                    timestamp,
                    timestampLimit,
                    chainID,
                    forcedBlockHashL1,
                    skipVerifyL1InfoRoot,
                    autoChangeL2Block,
                } = testVectors[i];

                // Adapts input
                if (typeof forcedBlockHashL1 === 'undefined') forcedBlockHashL1 = Constants.ZERO_BYTES32;
                if (!chainID) chainID = 1000;
                if (typeof oldAccInputHash === 'undefined') {
                    oldAccInputHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
                }
                if (typeof timestampLimit === 'undefined') {
                    timestampLimit = timestamp;
                }
                if (typeof l1InfoRoot === 'undefined') {
                    l1InfoRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
                }

                // init SMT Db
                const db = new zkcommonjs.MemDB(F);
                const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                    db,
                    poseidon,
                    [F.zero, F.zero, F.zero, F.zero],
                    zkcommonjs.smtUtils.stringToH4(oldAccInputHash),
                    genesis,
                    null,
                    null,
                    chainID,
                    testvectorsGlobalConfig.forkID,
                );

                expect(zkcommonjs.smtUtils.h4toString(zkEVMDB.stateRoot)).to.be.equal(expectedOldRoot);

                const extraData = { l1Info: {} };
                const batch = await zkEVMDB.buildBatch(
                    Scalar.e(timestampLimit),
                    sequencerAddress,
                    zkcommonjs.smtUtils.stringToH4(l1InfoRoot),
                    forcedBlockHashL1,
                    Constants.DEFAULT_MAX_TX,
                    {
                        skipVerifyL1InfoRoot: (typeof skipVerifyL1InfoRoot === 'undefined' || skipVerifyL1InfoRoot !== false),
                    },
                    extraData,
                );

                // TRANSACTIONS
                const txsList = [];
                let commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.Berlin });

                // If first tx is not TX_CHANGE_L2_BLOCK, add one by default
                const addChangeL2Block = typeof autoChangeL2Block === 'undefined' || autoChangeL2Block !== false;

                // If first tx is not TX_CHANGE_L2_BLOCK, add one by default
                if (addChangeL2Block && txs[0].type !== Constants.TX_CHANGE_L2_BLOCK) {
                    const txChangeL2Block = {
                        type: 11,
                        deltaTimestamp: timestampLimit,
                        l1Info: {
                            globalExitRoot: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
                            blockHash: '0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb',
                            timestamp: '42',
                        },
                        indexL1InfoTree: 0,
                    };
                    txs.unshift(txChangeL2Block);
                }

                for (let j = 0; j < txs.length; j++) {
                    let isLegacy = false;
                    const currentTx = txs[j];
                    // Check for TX_CHANGE_L2_BLOCK
                    if (currentTx.type === Constants.TX_CHANGE_L2_BLOCK) {
                        const rawChangeL2BlockTx = zkcommonjs.processorUtils.serializeChangeL2Block(currentTx);
                        const customRawTx = `0x${rawChangeL2BlockTx}`;

                        // Append l1Info to l1Info object
                        extraData.l1Info[currentTx.indexL1InfoTree] = currentTx.l1Info;

                        batch.addRawTx(customRawTx);
                        continue;
                    } else if (j === 0 && !testName.includes('change-l2-block')) {
                    // If first tx is not TX_CHANGE_L2_BLOCK, add one
                        const batchL2TxRaw = helpers.addRawTxChangeL2Block(batch, extraData, extraData);
                        txsList.push(batchL2TxRaw);
                    }
                    const isSigned = !!(currentTx.r && currentTx.v && currentTx.s);
                    const accountFrom = genesis.filter((x) => x.address.toLowerCase() === currentTx.from.toLowerCase())[0];
                    if (!accountFrom && !isSigned) {
                        // Ignore transaction
                        console.log('*******Tx Invalid --> Error: Invalid from address (tx ignored)');
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    // prepare tx
                    const txData = {
                        to: currentTx.to,
                        nonce: Number(currentTx.nonce),
                        value: new BN(currentTx.value),
                        data: currentTx.data,
                        gasLimit: new BN(currentTx.gasLimit),
                        gasPrice: new BN(currentTx.gasPrice),
                    };
                    if (typeof currentTx.chainId === 'undefined') {
                        isLegacy = true;
                        commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.TangerineWhistle });
                    } else {
                        txData.chainId = new BN(currentTx.chainId);
                    }
                    let tx;
                    if (isSigned) {
                        txData.s = new BN(currentTx.s.slice(2), 'hex');
                        txData.r = new BN(currentTx.r.slice(2), 'hex');
                        txData.v = new BN(currentTx.v.slice(2), 'hex');
                        tx = Transaction.fromTxData(txData, { common: commonCustom });
                    } else {
                        tx = Transaction.fromTxData(txData, { common: commonCustom }).sign(toBuffer(accountFrom.pvtKey));
                    }
                    if (currentTx.overwrite) {
                        // eslint-disable-next-line no-restricted-syntax
                        for (const paramOverwrite of Object.keys(currentTx.overwrite)) {
                            const txJSON = tx.toJSON();
                            txJSON[paramOverwrite] = currentTx.overwrite[paramOverwrite];
                            tx = Transaction.fromTxData(txJSON);
                        }
                    }
                    // check tx to
                    let to;
                    if (!ethers.utils.isAddress(txData.to.toString(16))) {
                        if (txData.to !== '0x') {
                            console.log('*******Tx Invalid --> Error: Invalid to address');
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                        to = '0x';
                    } else {
                        to = tx.to;
                    }
                    // check tx chainId
                    const sign = !(Number(tx.v) & 1);
                    const txChainId = (Number(tx.v) - 35) >> 1;
                    // add tx to txList with customRawTx
                    const messageToHash = [
                        tx.nonce.toString(16),
                        tx.gasPrice.toString(16),
                        tx.gasLimit.toString(16),
                        to.toString(16),
                        tx.value.toString(16),
                        tx.data.toString('hex'),
                    ];
                    if (!isLegacy) {
                        messageToHash.push(
                            ethers.utils.hexlify(txChainId),
                            '0x',
                            '0x',
                        );
                    }
                    const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                    const signData = ethers.utils.RLP.encode(newMessageToHash);
                    const r = tx.r.toString(16).padStart(32 * 2, '0');
                    const s = tx.s.toString(16).padStart(32 * 2, '0');
                    const v = (sign + 27).toString(16).padStart(1 * 2, '0');
                    if (typeof currentTx.effectivePercentage === 'undefined') {
                        currentTx.effectivePercentage = '0xff';
                    }
                    const calldata = signData.concat(r).concat(s).concat(v).concat(currentTx.effectivePercentage.slice(2));
                    txsList.push(calldata);
                    batch.addRawTx(calldata);
                }

                // Compare storage
                try {
                    await batch.executeTxs();
                } catch (e) {
                    console.log(e);
                }
                await zkEVMDB.consolidate(batch);
                // Check new root
                expect(zkcommonjs.smtUtils.h4toString(batch.currentStateRoot)).to.be.equal(expectedNewRoot);

                // Check balances and nonces
                // eslint-disable-next-line no-restricted-syntax
                for (const [address] of Object.entries(expectedNewLeafs)) {
                    const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                    expect(newLeaf.balance.toString()).to.equal(expectedNewLeafs[address].balance);
                    expect(newLeaf.nonce.toString()).to.equal(expectedNewLeafs[address].nonce);
                }
            }
        });
    }
});
