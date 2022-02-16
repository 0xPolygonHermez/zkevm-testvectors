/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
const { buildPoseidon } = require('circomlibjs');
const { Scalar } = require('ffjavascript');

const ethers = require('ethers');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const {
    MemDB, SMT, stateUtils, ZkEVMDB, processorUtils,
} = require('@polygon-hermez/zkevm-commonjs');

const { rawTxToCustomRawTx, toHexStringRlp } = processorUtils;

async function main() {
    const poseidon = await buildPoseidon();
    const { F } = poseidon;
    const testVectors = JSON.parse(fs.readFileSync(path.join(__dirname, '../../test-vector-data/state-transition.json')));

    for (let i = 0; i < testVectors.length; i++) {
        const {
            id,
            arity,
            genesis,
            txs,
            chainIdSequencer,
            sequencerAddress,
            expectedNewLeafs,
            localExitRoot,
            globalExitRoot,
            timestamp
        } = testVectors[i];

        const currentTestVector = testVectors[i];

        const db = new MemDB(F);
        const smt = new SMT(db, arity, poseidon, poseidon.F);

        const walletMap = {};
        const addressArray = [];
        const amountArray = [];
        const nonceArray = [];

        // create genesis block
        for (let j = 0; j < genesis.length; j++) {
            const {
                address, pvtKey, balance, nonce,
            } = genesis[j];

            const newWallet = new ethers.Wallet(pvtKey);
            expect(address).to.be.equal(newWallet.address);

            walletMap[address] = newWallet;
            addressArray.push(address);
            amountArray.push(Scalar.e(balance));
            nonceArray.push(Scalar.e(nonce));
        }

        const genesisRoot = await stateUtils.setGenesisBlock(addressArray, amountArray, nonceArray, smt);
        for (let j = 0; j < addressArray.length; j++) {
            const currentState = await stateUtils.getState(addressArray[j], smt, genesisRoot);

            expect(currentState.balance).to.be.equal(amountArray[j]);
            expect(currentState.nonce).to.be.equal(nonceArray[j]);
        }
        currentTestVector.expectedOldRoot = `0x${Scalar.e(F.toString(genesisRoot)).toString(16).padStart(64, '0')}`;

        /*
         * build, sign transaction and generate rawTxs
         * rawTxs would be the calldata inserted in the contract
         */
        const txProcessed = [];
        const rawTxs = [];
        for (let j = 0; j < txs.length; j++) {
            const txData = txs[j];
            const tx = {
                to: txData.to,
                nonce: txData.nonce,
                value: ethers.BigNumber.from(txData.value),
                gasLimit: txData.gasLimit,
                gasPrice: ethers.BigNumber.from(txData.gasPrice),
                chainId: txData.chainId,
                data: txData.data || '0x',
            };

            if (!ethers.utils.isAddress(tx.to) || !ethers.utils.isAddress(txData.from)) {
                expect(txData.rawTx).to.equal(undefined);
                continue;
            }

            try {
                let customRawTx;
                let rawTx;
                if (tx.chainId === 0) {
                    const signData = ethers.utils.RLP.encode([
                        toHexStringRlp(Scalar.e(tx.nonce)),
                        toHexStringRlp(tx.gasPrice),
                        toHexStringRlp(tx.gasLimit),
                        toHexStringRlp(tx.to),
                        toHexStringRlp(tx.value),
                        toHexStringRlp(tx.data),
                        toHexStringRlp(tx.chainId),
                        '0x',
                        '0x',
                    ]);
                    const digest = ethers.utils.keccak256(signData);
                    const signingKey = new ethers.utils.SigningKey(walletMap[txData.from].privateKey);
                    const signature = signingKey.signDigest(digest);
                    const r = signature.r.slice(2).padStart(64, '0'); // 32 bytes
                    const s = signature.s.slice(2).padStart(64, '0'); // 32 bytes
                    const v = (signature.v).toString(16).padStart(2, '0'); // 1 bytes
                    customRawTx = signData.concat(r).concat(s).concat(v);
                    
                    const signDataRawTx = ethers.utils.RLP.encode([
                        toHexStringRlp(Scalar.e(tx.nonce)),
                        toHexStringRlp(tx.gasPrice),
                        toHexStringRlp(tx.gasLimit),
                        toHexStringRlp(tx.to),
                        toHexStringRlp(tx.value),
                        toHexStringRlp(tx.data)
                    ]);
                    const digestRawTx = ethers.utils.keccak256(signDataRawTx);
                    const signatureRawTx = signingKey.signDigest(digestRawTx);
                    rawTx = ethers.utils.RLP.encode([
                        toHexStringRlp(Scalar.e(tx.nonce)),
                        toHexStringRlp(tx.gasPrice),
                        toHexStringRlp(tx.gasLimit),
                        toHexStringRlp(tx.to),
                        toHexStringRlp(tx.value),
                        toHexStringRlp(tx.data),
                        toHexStringRlp(signatureRawTx.v),
                        toHexStringRlp(signatureRawTx.r),
                        toHexStringRlp(signatureRawTx.s)
                    ]);

                } else {
                    rawTx= await walletMap[txData.from].signTransaction(tx);
                    customRawTx = rawTxToCustomRawTx(rawTx);
                }

                currentTestVector.txs[j].customRawTx = customRawTx;
                currentTestVector.txs[j].rawTx = rawTx;

                if (txData.encodeInvalidData) {
                    customRawTx = customRawTx.slice(0, -6);
                }
                rawTxs.push(customRawTx);
                txProcessed.push(txData);
            } catch (error) {
                console.log(error)
                expect(txData.rawTx).to.equal(undefined);
            }
        }

        // create a zkEVMDB and build a batch
        const zkEVMDB = await ZkEVMDB.newZkEVM(
            db,
            arity,
            poseidon,
            genesisRoot,
            F.e(Scalar.e(localExitRoot)),
        );


            const batch = await zkEVMDB.buildBatch(timestamp, sequencerAddress, chainIdSequencer, F.e(Scalar.e(globalExitRoot)));
        for (let j = 0; j < rawTxs.length; j++) {
            batch.addRawTx(rawTxs[j]);
        }

        // execute the transactions added to the batch
        await batch.executeTxs();

        const newRoot = batch.currentStateRoot;

        currentTestVector.expectedNewRoot = `0x${Scalar.e(F.toString(newRoot)).toString(16).padStart(64, '0')}`;

        // consoldate state
        await zkEVMDB.consolidate(batch);

        // Check balances and nonces
        for (const [address, leaf] of Object.entries(expectedNewLeafs)) { // eslint-disable-line
            const newLeaf = await zkEVMDB.getCurrentAccountState(address);
            const newLeafState = { balance: newLeaf.balance.toString(), nonce: newLeaf.nonce.toString() };
            currentTestVector.expectedNewLeafs[address] = newLeafState;
        }

        // Check errors on decode transactions
        const decodedTx = await batch.getDecodedTxs();
        
        for (let j = 0; j < decodedTx.length; j++) {
            const currentTx = decodedTx[j];
            const expectedTx = txProcessed[j];
            try {
                if (currentTx.reason !== expectedTx.reason) currentTestVector.txs[expectedTx.id].reason = currentTx.reason;
            } catch (error) {
                console.log({ currentTx }, { expectedTx }); // eslint-disable-line no-console
                throw new Error(`Batch Id : ${id} TxId:${expectedTx.id} ${error}`);
            }
        }

        // Check the circuit input
        const circuitInput = await batch.getCircuitInput();

        // Check the encode transaction match with the vector test
        currentTestVector.batchL2Data = batch.getBatchL2Data();

        currentTestVector.batchHashData = `0x${Scalar.e(circuitInput.batchHashData).toString(16).padStart(64, '0')}`;
        currentTestVector.inputHash = `0x${Scalar.e(circuitInput.inputHash).toString(16).padStart(64, '0')}`;

        currentTestVector.globalExitRoot = `0x${Scalar.e(circuitInput.globalExitRoot).toString(16).padStart(64, '0')}`;
        currentTestVector.localExitRoot = `0x${Scalar.e(circuitInput.oldLocalExitRoot).toString(16).padStart(64, '0')}`;
        currentTestVector.newLocalExitRoot = `0x${Scalar.e(circuitInput.newLocalExitRoot).toString(16).padStart(64, '0')}`;
    }

    const dir = path.join(__dirname, '../../test-vector-data/state-transition.json');
    await fs.writeFileSync(dir, JSON.stringify(testVectors, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
