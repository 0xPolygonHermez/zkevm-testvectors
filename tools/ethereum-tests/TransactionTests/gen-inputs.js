/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');
const { Scalar } = require('ffjavascript');
const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const helpers = require('../../../tools-calldata/helpers/helpers');

// example: npx mocha gen-inputs.js --vectors txs-calldata --inputs input_ --update --output

describe('Generate inputs executor from test-vectors', async function () {
    this.timeout(20000);
    let poseidon;
    let F;
    let outputName;
    let outputPath;
    let testPath;
    let test;
    let file;
    let info = '';

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('Load tests & generate input', async () => {
        file = (argv.test) ? argv.test : 'all';
        let files = [];
        if (file === 'all') {
            const direc = fs.readdirSync('../tests/TransactionTests');
            for (let x = 0; x < direc.length; x++) {
                const filesDirec = fs.readdirSync(`../tests/TransactionTests/${direc[x]}`);
                for (let y = 0; y < filesDirec.length; y++) {
                    files.push(`${direc[x]}/${filesDirec[y]}`);
                }
            }
        } else {
            files = [file];
        }
        for (let x = 0; x < files.length; x++) {
            try {
                file = files[x];
                if (file.includes('10MbData')) {
                    throw new Error('error');
                }
                file = file.endsWith('.json') ? file : `${file}.json`;
                outputPath = './inputs/';
                outputName = `${file}`;
                testPath = `../tests/TransactionTests/${file}`;
                // eslint-disable-next-line import/no-dynamic-require
                test = require(testPath);
                await hre.run('compile');
                console.log(`test vector name: ${file}`);

                const oldAccInputHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
                const timestamp = 1944498031;
                const sequencerAddress = '0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D';
                const chainIdSequencer = 1000;
                const globalExitRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
                const accountFrom = {
                    address: '0x4d5Cf5032B2a844602278b01199ED191A86c93ff',
                    pvtKey: '0x4d27a600dce8c29b7bd080e29a26972377dbb04d7a27d919adbb602bf13cfd23',
                    balance: '200000000000000000000',
                    nonce: '0',
                };
                file = file.split('/')[file.split('/').length - 1];
                const txBytes = test[file.split('.json')[0]].txbytes;
                const result = test[file.split('.json')[0]].result.Berlin;
                const txsParams = ethers.utils.RLP.decode(txBytes);
                const tx = {
                    nonce: txsParams[0],
                    gasPrice: txsParams[1],
                    gasLimit: txsParams[2],
                    to: txsParams[3],
                    value: txsParams[4],
                    data: txsParams[5],
                    v: txsParams[6],
                    r: txsParams[7],
                    s: txsParams[8],
                };

                const commonCustom = Common.custom({ chainId: chainIdSequencer }, { hardfork: Hardfork.Berlin });
                const txFromBytes = Transaction.fromSerializedTx(txBytes, { common: commonCustom });
                const d = ethers.utils.hexlify(txFromBytes.getMessageToVerifySignature());
                const r = ethers.utils.hexlify(tx.r);
                const s = ethers.utils.hexlify(tx.s);
                const v = ethers.utils.hexlify(tx.v);
                let raddr = 0;
                try {
                    raddr = ethers.utils.recoverAddress(d, {
                        r,
                        s,
                        v,
                    });
                } catch (err) {
                    throw new Error('recoverAddress error');
                }
                if (result.sender) { expect(raddr.toLowerCase()).to.be.equal(result.sender.toLowerCase()); }
                const genesis = [
                    accountFrom,
                    {
                        address: tx.to,
                        nonce: '0',
                        balance: '100000000000000000000',
                    }, {
                        address: sequencerAddress,
                        nonce: '0',
                        balance: '100000000000000000000',
                    },
                ];

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
                    chainIdSequencer,
                );

                // for (let i = 0; i < genesis.length; i++) {
                //     const { address } = genesis[i];
                //     const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                //     console.log(address);
                //     console.log('balance: ', newLeaf.balance.toString());
                //     console.log('nonce: ', newLeaf.nonce.toString());
                // }

                const batch = await zkEVMDB.buildBatch(
                    timestamp,
                    sequencerAddress,
                    zkcommonjs.smtUtils.stringToH4(globalExitRoot),
                );

                const accountPkFrom = toBuffer(accountFrom.pvtKey);
                // prepare tx
                const txData = {
                    to: tx.to,
                    nonce: tx.nonce,
                    value: tx.value,
                    data: tx.data,
                    gasLimit: tx.gasLimit,
                    gasPrice: tx.gasPrice,
                    chainId: chainIdSequencer,
                };

                let txSigned = Transaction.fromTxData(txData, { common: commonCustom }).sign(accountPkFrom);
                const sign = !(Number(txSigned.v) & 1);
                const chainId = (Number(txSigned.v) - 35) >> 1;
                const messageToHash = [
                    txSigned.nonce.toString(16),
                    txSigned.gasPrice.toString(16),
                    txSigned.gasLimit.toString(16),
                    txSigned.to.toString(16),
                    txSigned.value.toString(16),
                    txSigned.data.toString('hex'),
                    ethers.utils.hexlify(chainId),
                    '0x',
                    '0x',
                ];

                const newMessageToHash = helpers.updateMessageToHash(messageToHash);
                const signData = ethers.utils.RLP.encode(newMessageToHash);
                const rCalldata = txSigned.r.toString(16).padStart(32 * 2, '0');
                const sCalldata = txSigned.s.toString(16).padStart(32 * 2, '0');
                const vCalldata = (sign + 27).toString(16).padStart(1 * 2, '0');
                const calldata = signData.concat(rCalldata).concat(sCalldata).concat(vCalldata);
                batch.addRawTx(calldata);
                await batch.executeTxs();
                await zkEVMDB.consolidate(batch);

                const circuitInput = await batch.getStarkInput();

                for (let i = 0; i < genesis.length; i++) {
                    const { address } = genesis[i];
                    const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                    // console.log(address);
                    // console.log('balance: ', newLeaf.balance.toString());
                    // console.log('nonce: ', newLeaf.nonce.toString());
                    if (address.toLowerCase() === accountFrom.address.toLowerCase()) {
                        const expectedIntrinsicGAS = Scalar.e(result.intrinsicGas.slice(2), 16);
                        // console.log('INTRINSIC GAS expected: ', expectedIntrinsicGAS.toString());
                        const genesisBalance = Scalar.e(genesis[i].balance);
                        const value = tx.value === '0x' ? Scalar.e(0) : tx.value;
                        // console.log(Scalar.e(newLeaf.balance));
                        // console.log(Scalar.e(expectedIntrinsicGAS));
                        // console.log(Scalar.e(value));
                        const actualBalance = Scalar.add(Scalar.add(
                            Scalar.e(newLeaf.balance),
                            Scalar.e(expectedIntrinsicGAS),
                        ), Scalar.e(value));
                        expect(genesisBalance.toString()).to.be.equal(actualBalance.toString());
                    }
                }

                const dir = path.join(__dirname, outputPath);
                await fs.writeFileSync(`${dir}${outputName}`, JSON.stringify(circuitInput, null, 2));
            } catch (e) {
                info += `${chalk.red('Error')}\n`;
                info += `${chalk.yellow(`${testPath}\n`)}`;
            }
        }
        console.log(info);
    });
});
