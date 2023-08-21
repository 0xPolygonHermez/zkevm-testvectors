/* eslint-disable global-require */
/* eslint-disable guard-for-in */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const { argv } = require('yargs');
const { expect } = require('chai');
const {
    MemDB, ZkEVMDB, processorUtils, smtUtils, getPoseidon, Constants,
} = require('@0xpolygonhermez/zkevm-commonjs');

// input file
const pathInput = path.join(__dirname, './input_gen.json');

// input executor folder
const { pathTestVectors } = require('../../helpers/helpers');
const helpers = require('../../../tools-calldata/helpers/helpers');

const pathInputExecutor = path.join(pathTestVectors, 'inputs-executor/no-data');

describe('Check roots same txs in different batches', function () {
    let update;

    let rootTxSameBatch;
    let rootTxDifferentBatch;

    it('load test vectors', async () => {
        update = typeof argv.update !== 'undefined';
    });

    it('Two txs in the same batch', async () => {
        // build poseidon
        const poseidon = await getPoseidon();
        const { F } = poseidon;

        // read generate input
        const generateData = require(pathInput);

        // mapping wallets
        const walletMap = {};

        for (let i = 0; i < generateData.genesis.length; i++) {
            const {
                address, pvtKey,
            } = generateData.genesis[i];

            const newWallet = new ethers.Wallet(pvtKey);
            walletMap[address] = newWallet;
        }

        // create a zkEVMDB and build a batch
        const db = new MemDB(F);
        const zkEVMDB = await ZkEVMDB.newZkEVM(
            db,
            poseidon,
            [F.zero, F.zero, F.zero, F.zero], // empty smt
            smtUtils.stringToH4(generateData.oldAccInputHash),
            generateData.genesis,
            null,
            null,
            generateData.chainID,
            generateData.forkID,
        );

        if (generateData.globalExitRoot) {
            generateData.historicGERRoot = generateData.globalExitRoot;
        }

        // start batch
        const batch = await zkEVMDB.buildBatch(
            generateData.timestamp,
            generateData.sequencerAddr,
            smtUtils.stringToH4(generateData.historicGERRoot),
            0,
            Constants.DEFAULT_MAX_TX,
            {
                skipVerifyGER: true,
            },
        );

        // build txs
        for (let i = 0; i < generateData.tx.length; i++) {
            const genTx = generateData.tx[i];

            helpers.addRawTxChangeL2Block(batch);

            const tx = {
                to: genTx.to,
                nonce: genTx.nonce,
                value: ethers.utils.parseUnits(genTx.value, 'wei'),
                gasLimit: genTx.gasLimit,
                gasPrice: ethers.utils.parseUnits(genTx.gasPrice, 'wei'),
                chainId: genTx.chainId,
                data: genTx.data || '0x',
            };

            const rawTxEthers = await walletMap[genTx.from].signTransaction(tx);
            const customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);

            // add tx to batch
            batch.addRawTx(customRawTx);
        }

        // build batch
        await batch.executeTxs();
        // consolidate state
        await zkEVMDB.consolidate(batch);

        // get stark input
        const starkInput = await batch.getStarkInput();

        rootTxSameBatch = starkInput.newStateRoot;

        if (update) {
            const pathOutput = path.join(pathInputExecutor, 'txs-same-batch.json');
            await fs.writeFileSync(pathOutput, JSON.stringify(starkInput, null, 2));
        }
    });

    it('Two txs in different batches', async () => {
        // build poseidon
        const poseidon = await getPoseidon();
        const { F } = poseidon;

        // read generate input
        const generateData = require(pathInput);

        // mapping wallets
        const walletMap = {};

        for (let i = 0; i < generateData.genesis.length; i++) {
            const {
                address, pvtKey,
            } = generateData.genesis[i];

            const newWallet = new ethers.Wallet(pvtKey);
            walletMap[address] = newWallet;
        }

        // create a zkEVMDB and build a batch
        const db = new MemDB(F);
        const zkEVMDB = await ZkEVMDB.newZkEVM(
            db,
            poseidon,
            [F.zero, F.zero, F.zero, F.zero], // empty smt
            smtUtils.stringToH4(generateData.oldAccInputHash),
            generateData.genesis,
            null,
            null,
            generateData.chainID,
            generateData.forkID,
        );

        // build txs
        let batch;

        for (let i = 0; i < generateData.tx.length; i++) {
            // start batch
            batch = await zkEVMDB.buildBatch(
                generateData.timestamp,
                generateData.sequencerAddr,
                smtUtils.stringToH4(generateData.historicGERRoot),
                0,
                Constants.DEFAULT_MAX_TX,
                {
                    skipVerifyGER: true,
                },
            );

            helpers.addRawTxChangeL2Block(batch);

            const genTx = generateData.tx[i];

            const tx = {
                to: genTx.to,
                nonce: genTx.nonce,
                value: ethers.utils.parseUnits(genTx.value, 'wei'),
                gasLimit: genTx.gasLimit,
                gasPrice: ethers.utils.parseUnits(genTx.gasPrice, 'wei'),
                chainId: genTx.chainId,
                data: genTx.data || '0x',
            };

            const rawTxEthers = await walletMap[genTx.from].signTransaction(tx);
            const customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);

            // add tx to batch
            batch.addRawTx(customRawTx);

            // build batch
            await batch.executeTxs();
            const starkInput = await batch.getStarkInput();
            // console.log(starkInput);

            if (update) {
                const pathOutput = path.join(pathInputExecutor, `txs-different-batch_${i}.json`);
                await fs.writeFileSync(pathOutput, JSON.stringify(starkInput, null, 2));
            }

            // consolidate state
            await zkEVMDB.consolidate(batch);
        }

        // get stark input
        const starkInput = await batch.getStarkInput();
        rootTxDifferentBatch = starkInput.newStateRoot;
    });

    it('Assert roots', async () => {
        expect(rootTxSameBatch).to.be.equal(rootTxDifferentBatch);
    });
});
