/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */

const { Scalar } = require('ffjavascript');
const fs = require('fs');
const { argv } = require('yargs');

const ethers = require('ethers');
const { expect } = require('chai');
const {
    Address, toBuffer,
} = require('ethereumjs-util');
const path = require('path');
const lodash = require('lodash');

const {
    MemDB, ZkEVMDB, getPoseidon, processorUtils, smtUtils, Constants, stateUtils,
} = require('@0xpolygonhermez/zkevm-commonjs');

// input file
const pathInput = path.join(__dirname, './input_gen.json');

// input executor folder
const { pathTestVectors } = require('../../helpers/helpers');

const pathInputExecutor = path.join(pathTestVectors, 'inputs-executor/no-data');

describe('Header timestamp', function () {
    this.timeout(50000);
    let update;
    let poseidon;
    let F;
    let testVectors;
    const chainID = 1000;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectors = require(pathInput);

        update = argv.update === true;
    });

    it('Check test vectors', async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const {
                id,
                genesis,
                expectedOldRoot,
                batches,
                sequencerAddress,
                bridgeDeployed,
                oldAccInputHash,
            } = testVectors[i];

            const db = new MemDB(F);
            // create a zkEVMDB to compile the sc
            const zkEVMDB = await ZkEVMDB.newZkEVM(
                db,
                poseidon,
                [F.zero, F.zero, F.zero, F.zero],
                smtUtils.stringToH4(oldAccInputHash),
                genesis,
                null,
                null,
                chainID,
            );

            // Check evm contract params
            for (const contract of genesis) {
                if (contract.contractName) {
                    const contractAddres = new Address(toBuffer(contract.address));

                    const contractAccount = await zkEVMDB.vm.stateManager.getAccount(contractAddres);
                    expect(await contractAccount.isContract()).to.be.true;

                    const contractCode = await zkEVMDB.vm.stateManager.getContractCode(contractAddres);
                    expect(contractCode.toString('hex')).to.be.equal(contract.bytecode.slice(2));

                    const dumpDB = await zkEVMDB.dumpStorage(contract.address);

                    for (const [key, value] of Object.entries(contract.storage)) {
                        const contractStorage = await zkEVMDB.vm.stateManager.getContractStorage(contractAddres, toBuffer(key));
                        expect(contractStorage.toString('hex')).to.equal(value.slice(2));
                        expect(dumpDB[key]).to.be.equal(value);
                    }
                }
            }

            if (!update) {
                expect(smtUtils.h4toString(zkEVMDB.stateRoot)).to.be.equal(expectedOldRoot);
            } else {
                testVectors[i].expectedOldRoot = smtUtils.h4toString(zkEVMDB.stateRoot);
            }

            /*
             * build, sign transaction and generate rawTxs
             * rawTxs would be the calldata inserted in the contract
             */
            const txProcessed = [];

            for (let k = 0; k < batches.length; k++) {
                const {
                    txs, expectedNewRoot, expectedNewLeafs, batchL2Data, globalExitRoot,
                    inputHash, timestamp, batchHashData, newLocalExitRoot,
                } = batches[k];
                const rawTxs = [];
                for (let j = 0; j < txs.length; j++) {
                    const txData = txs[j];

                    const tx = {
                        to: txData.to,
                        nonce: txData.nonce,
                        value: processorUtils.toHexStringRlp(ethers.utils.parseUnits(txData.value, 'wei')),
                        gasLimit: txData.gasLimit,
                        gasPrice: processorUtils.toHexStringRlp(ethers.utils.parseUnits(txData.gasPrice, 'wei')),
                        chainId: txData.chainId,
                        data: txData.data || '0x',
                    };

                    if ((tx.to && tx.to !== '0x0' && !ethers.utils.isAddress(tx.to)) || !ethers.utils.isAddress(txData.from)) {
                        expect(txData.customRawTx).to.equal(undefined);
                        // eslint-disable-next-line no-continue
                        continue;
                    }

                    let customRawTx;
                    const address = genesis.find((o) => o.address === txData.from);
                    const wallet = new ethers.Wallet(address.pvtKey);
                    if (tx.chainId === 0) {
                        const signData = ethers.utils.RLP.encode([
                            processorUtils.toHexStringRlp(Scalar.e(tx.nonce)),
                            processorUtils.toHexStringRlp(tx.gasPrice),
                            processorUtils.toHexStringRlp(tx.gasLimit),
                            processorUtils.toHexStringRlp(tx.to),
                            processorUtils.toHexStringRlp(tx.value),
                            processorUtils.toHexStringRlp(tx.data),
                            processorUtils.toHexStringRlp(tx.chainId),
                            '0x',
                            '0x',
                        ]);
                        const digest = ethers.utils.keccak256(signData);
                        const signingKey = new ethers.utils.SigningKey(address.pvtKey);
                        const signature = signingKey.signDigest(digest);
                        const r = signature.r.slice(2).padStart(64, '0'); // 32 bytes
                        const s = signature.s.slice(2).padStart(64, '0'); // 32 bytes
                        const v = (signature.v).toString(16).padStart(2, '0'); // 1 bytes
                        customRawTx = signData.concat(r).concat(s).concat(v);
                    } else {
                        const rawTxEthers = await wallet.signTransaction(tx);
                        if (!update) {
                            expect(rawTxEthers).to.equal(txData.rawTx);
                        } else {
                            txData.rawTx = rawTxEthers;
                        }
                        customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);
                    }

                    if (!update) {
                        expect(customRawTx).to.equal(txData.customRawTx);
                    } else {
                        txData.customRawTx = customRawTx;
                    }

                    if (txData.encodeInvalidData) {
                        customRawTx = customRawTx.slice(0, -6);
                    }
                    rawTxs.push(customRawTx);
                    txProcessed.push(txData);
                }

                const batch = await zkEVMDB.buildBatch(timestamp, sequencerAddress, smtUtils.stringToH4(globalExitRoot));
                for (let j = 0; j < rawTxs.length; j++) {
                    batch.addRawTx(rawTxs[j]);
                }

                // execute the transactions added to the batch
                await batch.executeTxs();
                // consolidate state
                await zkEVMDB.consolidate(batch);

                const newRoot = batch.currentStateRoot;
                if (!update) {
                    expect(smtUtils.h4toString(newRoot)).to.be.equal(expectedNewRoot);
                } else {
                    testVectors[i].batches[k].expectedNewRoot = smtUtils.h4toString(newRoot);
                }

                // Check errors on decode transactions
                const decodedTx = await batch.getDecodedTxs();

                if (!update) {
                    for (let j = 0; j < decodedTx.length; j++) {
                        const currentTx = decodedTx[j];
                        const expectedTx = txProcessed[j];
                        try {
                            expect(currentTx.reason).to.be.equal(expectedTx.reason);
                        } catch (error) {
                            console.log({ currentTx }, { expectedTx }); // eslint-disable-line no-console
                            throw new Error(`Batch Id : ${id} TxId:${expectedTx.id} ${error}`);
                        }
                    }
                }

                // Check balances and nonces
                const updatedAccounts = batch.getUpdatedAccountsBatch();
                const newLeafs = {};
                for (const item in updatedAccounts) {
                    const address = item;
                    const account = updatedAccounts[address];
                    newLeafs[address] = {};

                    const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                    expect(newLeaf.balance.toString()).to.equal(account.balance.toString());
                    expect(newLeaf.nonce.toString()).to.equal(account.nonce.toString());

                    const smtNewLeaf = await zkEVMDB.getCurrentAccountState(address);
                    expect(smtNewLeaf.balance.toString()).to.equal(account.balance.toString());
                    expect(smtNewLeaf.nonce.toString()).to.equal(account.nonce.toString());

                    newLeafs[address].balance = account.balance.toString();
                    newLeafs[address].nonce = account.nonce.toString();

                    if (account.isContract() || address.toLowerCase() === Constants.ADDRESS_SYSTEM.toLowerCase()
                        || address.toLowerCase() === Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2.toLowerCase()) {
                        const storage = await zkEVMDB.dumpStorage(address);
                        newLeafs[address].storage = storage;
                    }
                }
                for (const leaf of genesis) {
                    const address = leaf.address.toLowerCase();
                    if (!newLeafs[address]) {
                        newLeafs[address] = { ...leaf };
                        const storage = await zkEVMDB.dumpStorage(address);
                        if (storage !== null) {
                            newLeafs[address].storage = storage;
                        }
                        delete newLeafs[address].address;
                        delete newLeafs[address].bytecode;
                        delete newLeafs[address].contractName;
                    }
                }

                if (!update) {
                    for (const [address, leaf] of Object.entries(expectedNewLeafs)) {
                        expect(lodash.isEqual(leaf, newLeafs[address])).to.be.equal(true);
                    }
                } else {
                    testVectors[i].batches[k].expectedNewLeafs = newLeafs;
                }

                // Check global and local exit roots
                const addressInstanceGlobalExitRoot = new Address(toBuffer(Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2));
                const localExitRootPosBuffer = toBuffer(ethers.utils.hexZeroPad(Constants.LOCAL_EXIT_ROOT_STORAGE_POS, 32));
                const globalExitRootPos = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [globalExitRoot, Constants.GLOBAL_EXIT_ROOT_STORAGE_POS]);
                const globalExitRootPosBuffer = toBuffer(globalExitRootPos);

                // Check local exit root
                const localExitRootVm = await zkEVMDB.vm.stateManager
                    .getContractStorage(addressInstanceGlobalExitRoot, localExitRootPosBuffer);
                const localExitRootSmt = (await stateUtils.getContractStorage(
                    Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2,
                    zkEVMDB.smt,
                    zkEVMDB.stateRoot,
                    [Constants.LOCAL_EXIT_ROOT_STORAGE_POS],
                ))[Constants.LOCAL_EXIT_ROOT_STORAGE_POS];

                if (Scalar.eq(localExitRootSmt, Scalar.e(0))) {
                    expect(localExitRootVm.toString('hex')).to.equal('');
                    expect(newLocalExitRoot).to.equal(ethers.constants.HashZero);
                } else {
                    expect(localExitRootVm.toString('hex')).to.equal(localExitRootSmt.toString(16).padStart(64, '0'));
                    expect(localExitRootVm.toString('hex')).to.equal(newLocalExitRoot.slice(2));
                }

                // Check global exit root
                const timestampVm = await zkEVMDB.vm.stateManager.getContractStorage(
                    addressInstanceGlobalExitRoot,
                    globalExitRootPosBuffer,
                );
                const timestampSmt = (await stateUtils.getContractStorage(
                    Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2,
                    zkEVMDB.smt,
                    zkEVMDB.stateRoot,
                    [globalExitRootPos],
                ))[Scalar.e(globalExitRootPos)];

                expect(Scalar.fromString(timestampVm.toString('hex'), 16)).to.equal(timestampSmt);

                // Check through a call in the EVM
                if (bridgeDeployed) {
                    const interfaceGlobal = new ethers.utils.Interface(['function globalExitRootMap(uint256)']);
                    const encodedData = interfaceGlobal.encodeFunctionData('globalExitRootMap', [batch.newNumBatch]);
                    const globalExitRootResult = await zkEVMDB.vm.runCall({
                        to: addressInstanceGlobalExitRoot,
                        caller: Address.zero(),
                        data: Buffer.from(encodedData.slice(2), 'hex'),
                    });
                    expect(globalExitRootResult.execResult.returnValue.toString('hex')).to.be.equal(globalExitRoot.slice(2));
                }

                // Check the circuit input
                const circuitInput = await batch.getStarkInput();

                // Check the encode transaction match with the vector test
                if (!update) {
                    expect(batchL2Data).to.be.equal(batch.getBatchL2Data());
                    // Check the batchHashData and the input hash
                    expect(batchHashData).to.be.equal(circuitInput.batchHashData);
                    expect(inputHash).to.be.equal(circuitInput.inputHash);
                    expect(newLocalExitRoot).to.be.equal(circuitInput.newLocalExitRoot);
                } else {
                    testVectors[i].batches[k].batchL2Data = batch.getBatchL2Data();
                    testVectors[i].batches[k].batchHashData = circuitInput.batchHashData;
                    testVectors[i].batches[k].inputHash = circuitInput.inputHash;
                    testVectors[i].batches[k].newLocalExitRoot = circuitInput.newLocalExitRoot;
                }

                if (update) {
                    const pathOutput = path.join(pathInputExecutor, `header_timestamp_${k}.json`);
                    await fs.writeFileSync(pathOutput, JSON.stringify(circuitInput, null, 2));
                }
            }
        }
    });
});
