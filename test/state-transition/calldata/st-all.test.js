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

const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const fs = require('fs');
const path = require('path');
const helpers = require('../../../tools-calldata/helpers/helpers');

// load list test-vectors
const { pathTestVectors } = require('../../helpers/helpers');

const folderStateTransition = path.join(pathTestVectors, './state-transition/calldata');
let listTests = fs.readdirSync(folderStateTransition);
listTests = listTests.filter((fileName) => path.extname(fileName) === '.json');

describe('Run state-transition tests: calldata', async function () {
    this.timeout(60000);
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

            for (let i = 0; i < testVectors.length; i++) {
                let {
                    genesis,
                    expectedOldRoot,
                    txs,
                    expectedNewRoot,
                    sequencerAddress,
                    expectedNewLeafs,
                    oldLocalExitRoot,
                    globalExitRoot,
                    timestamp,
                    chainID,
                } = testVectors[i];

                if (!chainID) chainID = 1000;

                // init SMT Db
                const db = new zkcommonjs.MemDB(F);
                const zkEVMDB = await zkcommonjs.ZkEVMDB.newZkEVM(
                    db,
                    poseidon,
                    [F.zero, F.zero, F.zero, F.zero],
                    zkcommonjs.smtUtils.stringToH4(oldLocalExitRoot),
                    genesis,
                    null,
                    null,
                    chainID,
                );

                expect(zkcommonjs.smtUtils.h4toString(zkEVMDB.stateRoot)).to.be.equal(expectedOldRoot);

                const batch = await zkEVMDB.buildBatch(
                    timestamp,
                    sequencerAddress,
                    zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                );

                // TRANSACTIONS
                const txsList = [];
                let commonCustom = Common.custom({ chainId: chainID }, { hardfork: Hardfork.Berlin });

                for (let j = 0; j < txs.length; j++) {
                    let isLegacy = false;
                    const currentTx = txs[j];
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
                    const calldata = signData.concat(r).concat(s).concat(v);
                    txsList.push(calldata);
                    batch.addRawTx(calldata);
                }

                // Compare storage
                await batch.executeTxs();
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
