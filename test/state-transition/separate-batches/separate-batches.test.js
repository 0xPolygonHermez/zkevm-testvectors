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
const helpers = require('../../../tools-inputs/helpers/helpers');

const testvectorsGlobalConfig = require(path.join(__dirname, '../../../tools-inputs/testvectors.config.json'));
const pathInputExecutor = path.join(helpers.pathTestVectors, 'inputs-executor/no-data');
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
            testvectorsGlobalConfig.forkID,
        );

        if (typeof generateData.forcedBlockHashL1 === 'undefined') generateData.forcedBlockHashL1 = Constants.ZERO_BYTES32;
        if (typeof generateData.l1InfoRoot === 'undefined') {
            generateData.l1InfoRoot = '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9';
        }

        // start batch
        const extraData = { l1Info: {} };
        const batch = await zkEVMDB.buildBatch(
            generateData.timestamp,
            generateData.sequencerAddr,
            smtUtils.stringToH4(generateData.l1InfoRoot),
            generateData.forcedBlockHashL1,
            Constants.DEFAULT_MAX_TX,
            {
                skipVerifyL1InfoRoot: true,
            },
            extraData,
        );

        // build txs
        for (let i = 0; i < generateData.tx.length; i++) {
            const genTx = generateData.tx[i];

            const dataChangeL2Block = {
                type: 11,
                deltaTimestamp: '1000',
                l1Info: {
                    globalExitRoot: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
                    blockHash: '0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb',
                    timestamp: '42',
                },
                indexL1InfoTree: batch.rawTxs.length + 1,
            };

            helpers.addRawTxChangeL2Block(batch, extraData, extraData, dataChangeL2Block);

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
        const res = await batch.executeTxs();
        // consolidate state
        await zkEVMDB.consolidate(batch);

        // get stark input
        const starkInput = await batch.getStarkInput();
        rootTxSameBatch = starkInput.newStateRoot;
        starkInput.l1InfoTree = Object.assign(starkInput.l1InfoTree, extraData.l1Info);
        starkInput.virtualCounters = res.virtualCounters;
        if (update) {
            const pathOutput = path.join(pathInputExecutor, 'txs-same-batch.json');
            await fs.writeFileSync(pathOutput, JSON.stringify(starkInput, null, 2));
            generateData.newStateRoot = starkInput.newStateRoot;
            generateData.newAccInputHash = starkInput.newAccInputHash;
            generateData.forkID = testvectorsGlobalConfig.forkID;
            generateData.l1InfoTree = starkInput.l1InfoTree;
            generateData.virtualCounters = starkInput.virtualCounters;
            delete generateData.globalExitRoot;
            await fs.writeFileSync(pathInput, JSON.stringify(generateData, null, 2));
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
            testvectorsGlobalConfig.forkID,
        );

        // build txs
        let batch;

        for (let i = 0; i < generateData.tx.length; i++) {
            // start batch
            const extraData = { l1Info: {} };
            batch = await zkEVMDB.buildBatch(
                generateData.timestamp,
                generateData.sequencerAddr,
                smtUtils.stringToH4(generateData.l1InfoRoot),
                generateData.forcedBlockHashL1,
                Constants.DEFAULT_MAX_TX,
                {
                    skipVerifyL1InfoRoot: true,
                },
                extraData,
            );

            helpers.addRawTxChangeL2Block(batch, extraData, extraData);

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
            const res = await batch.executeTxs();
            const starkInput = await batch.getStarkInput();
            starkInput.l1InfoTree = Object.assign(starkInput.l1InfoTree, extraData.l1Info);
            starkInput.virtualCounters = res.virtualCounters;
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
