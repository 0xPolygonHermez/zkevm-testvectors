/* eslint-disable no-continue */
/* eslint-disable quotes */
/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unreachable-loop */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { expect } = require('chai');

const txsPaths = ['./txs.json'];

describe('Run internal testnet tests', async function () {
    this.timeout(0);
    // Provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.ENDPOINT);
    // Signer
    const wallet = (new ethers.Wallet(process.env.PRIVATE_KEY)).connect(provider);
    // Loop paths
    for (const dir of txsPaths) {
        const txs = JSON.parse(fs.readFileSync(path.join(__dirname, dir)));

        // Loop txs
        for (const test of txs) {
            if (test.disable) {
                continue;
            }
            it(test.description, async () => {
                try {
                    const { tx } = test;
                    switch (test.method) {
                    case 'RLP':
                        tx.value = ethers.utils.parseEther(tx.value);
                        tx.nonce = await provider.getTransactionCount(wallet.address);
                        tx.gasLimit = ethers.BigNumber.from(0);
                        tx.gasPrice = ethers.BigNumber.from(ethers.utils.parseUnits('10', 'gwei'));
                        tx.data = '0x0000';
                        tx.chainId = 1440;
                        let signedTx = await wallet.signTransaction(tx);
                        const decoded = ethers.utils.RLP.decode(signedTx);
                        const ads = await provider.send('eth_sendRawTransaction', [signedTx]);
                        const r = await provider.sendTransaction(signedTx);
                        const as = await r.wait();
                        console.log('RLP');
                        break;
                    default:
                    // Check is signed
                        const isSigned = !!(tx.r && tx.v && tx.s);
                        tx.gasLimit = ethers.BigNumber.from(100000);
                        tx.gasPrice = ethers.BigNumber.from(100000000000); // just in case , seems pretty standard
                        if (isSigned) {
                            const stx = {
                                to: tx.to,
                                nonce: await provider.getTransactionCount(tx.from),
                                value: ethers.utils.parseEther(tx.value),
                                gasLimit: ethers.BigNumber.from(tx.gasLimit).toHexString(),
                                gasPrice: ethers.BigNumber.from(tx.gasPrice).toHexString(),
                                data: tx.data,
                            };
                            const signature = {
                                v: tx.v,
                                r: tx.r,
                                s: tx.s,
                            };
                            const serializedTransaction = ethers.utils.serializeTransaction(stx, signature);
                            const sentTx = await (await provider.sendTransaction(serializedTransaction)).wait();
                            expect(sentTx.status).to.equal(1);
                            console.log(r);
                        } else {
                            delete tx.from;
                            tx.value = ethers.utils.parseEther(tx.value);
                            if (tx.chainId === 0) {
                                tx.type = 0;
                                delete tx.chainId;
                            }
                            const sentTx = await (await wallet.sendTransaction(tx)).wait();
                            expect(sentTx.status).to.equal(1);
                            console.log(sentTx);
                        }
                    }
                } catch (e) {
                    expect(e.reason).to.equal(test.error);
                }
            });
        }
    }
});
