/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-destructuring */
const VM = require('@polygon-hermez/vm').default;
const { Scalar } = require('ffjavascript');
const fs = require('fs');
const { argv } = require('yargs');
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const ethers = require('ethers');
const { expect } = require('chai');
const {
    Address, toBuffer, Account, BN,
} = require('ethereumjs-util');
const path = require('path');
const lodash = require('lodash');
const hre = require('hardhat');

const {
    MemDB, ZkEVMDB, getPoseidon, processorUtils, smtUtils, Constants, stateUtils,
} = require('@0xpolygonhermez/zkevm-commonjs');
const helpers = require('../../../tools-inputs/helpers/helpers');

const testAccountDeploy = {
    pvtKey: '0x28b2b0318721be8c8339199172cd7cc8f5e273800a35616ec893083a4b32c02e',
};

const artifactsPath = path.join(__dirname, '../../../artifacts/tools-inputs/tools-calldata/contracts');

// input file
const pathGenTestVector = path.join(__dirname, './gen_test-vector.json');
// input file
const pathGenInput = path.join(__dirname, './input_gen.json');

// input executor folder
const testvectorsGlobalConfig = require(path.join(__dirname, '../../../tools-inputs/testvectors.config.json'));
const pathInputExecutor = path.join(__dirname, '../../../inputs-executor/no-data');

describe('Header timestamp', function () {
    this.timeout(50000);
    let update;
    let poseidon;
    let F;
    let genTestVectors;
    let genInput;
    let updateTestVectors;
    const chainID = 1000;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        genTestVectors = require(pathGenTestVector);
        genInput = require(pathGenInput);
        update = argv.update === true;
    });

    it('Load generate test vectors', async () => {
        await hre.run('compile');
    });

    it('Generate test vector', async () => {
        updateTestVectors = JSON.parse(JSON.stringify(genTestVectors));
        genInput = genTestVectors[0];
        const {
            genesis,
            batches,
            defaultChainId,
        } = genTestVectors[0];

        const common = Common.custom({ chainId: defaultChainId }, { hardfork: Hardfork.Berlin });
        const vm = new VM({ common, allowUnlimitedContractSize: true });

        const auxGenesis = [];

        for (let j = 0; j < genesis.accounts.length; j++) {
            const {
                address, balance, nonce, pvtKey, bytecode, storage,
            } = genesis.accounts[j];

            auxGenesis.push({
                address,
                nonce,
                balance,
                pvtKey,
                bytecode,
                storage,
            });
        }
        const contracts = [];
        if (genesis.contracts) {
            // Create account with balance
            const accountPk = toBuffer(testAccountDeploy.pvtKey);
            const accountAddress = Address.fromPrivateKey(accountPk);
            const acctDataDeploy = {
                nonce: 0,
                balance: new BN(10).pow(new BN(18)), // 10 eth
            };
            const account = Account.fromAccountData(acctDataDeploy);
            await vm.stateManager.putAccount(accountAddress, account);
            // Deploy contracts
            for (let j = 0; j < genesis.contracts.length; j++) {
                const { contractName, paramsDeploy } = genesis.contracts[j];
                // eslint-disable-next-line import/no-dynamic-require
                const { abi, bytecode, deployedBytecode } = require(`${artifactsPath}/${contractName}.sol/${contractName}.json`);
                const interfaceContract = new ethers.utils.Interface(abi);
                const contractAddress = await helpers.deployContract(vm, accountPk, bytecode, paramsDeploy);
                const accountContract = {
                    nonce: 1,
                    balance: 0,
                };
                const contract = {
                    contractName,
                    contractAddress,
                    interfaceContract,
                    bytecode: deployedBytecode,
                };
                contracts.push(contract);

                const sto = await vm.stateManager.dumpStorage(contract.contractAddress);
                const storage = {};
                // add contract storage
                const keys = Object.keys(sto).map((v) => toBuffer(`0x${v}`));
                const values = Object.values(sto).map((v) => toBuffer(ethers.utils.RLP.decode(`0x${v}`)));
                for (let k = 0; k < keys.length; k++) {
                    storage[`0x${keys[k].toString('hex')}`] = `0x${values[k].toString('hex')}`;
                }

                auxGenesis.push({
                    address: contractAddress.toString('hex'),
                    nonce: accountContract.nonce,
                    balance: accountContract.balance,
                    bytecode: deployedBytecode,
                    abi,
                    storage,
                });
            }
        }

        let auxBatch;
        for (let j = 0; j < batches.length; j++) {
            const { txs } = batches[j];
            auxBatch = batches[j];
            const auxTxs = [];
            for (let j2 = 0; j2 < txs.length; j2++) {
                const currentTx = txs[j2];
                let outputTx = {};
                if (currentTx.to === 'contract') {
                    let contract;
                    let functionData;
                    let to;

                    if (typeof currentTx.contractAddress !== 'undefined') {
                        if (typeof currentTx.abiName === 'undefined') {
                            throw new Error('Must define an abiName property if a call is made to a contract address');
                        }
                        const { abi } = require(`${artifactsPath}/${currentTx.abiName}.sol/${currentTx.abiName}.json`);
                        const interfaceContract = new ethers.utils.Interface(abi);
                        functionData = interfaceContract.encodeFunctionData(currentTx.function, currentTx.params);
                        to = currentTx.contractAddress;
                    } else {
                        // eslint-disable-next-line prefer-destructuring
                        contract = contracts.filter((x) => x.contractName === currentTx.contractName)[0];
                        functionData = contract.interfaceContract.encodeFunctionData(currentTx.function, currentTx.params);
                        if (currentTx.data) {
                            functionData += currentTx.data.startsWith('0x') ? currentTx.data.slice(2) : currentTx.data;
                        }
                        to = contract.contractAddress.toString('hex');
                    }
                    outputTx = {
                        from: currentTx.from,
                        to,
                        nonce: currentTx.nonce,
                        value: currentTx.value,
                        data: functionData,
                        gasLimit: currentTx.gasLimit,
                        gasPrice: currentTx.gasPrice,
                        chainId: currentTx.chainId,
                        effectivePercentage: currentTx.effectivePercentage,
                        reason: currentTx.reason,
                    };
                    if (currentTx.rawTx) { outputTx.rawTx = currentTx.rawTx; }
                    if (currentTx.customRawTx) { outputTx.customRawTx = currentTx.customRawTx; }
                }
                auxTxs.push(outputTx);
            }
            auxBatch.txs = auxTxs;
            genInput.batches[j] = auxBatch;
        }
        genInput.genesis = auxGenesis;
    });

    it('Check test vectors', async () => {
        const {
            id,
            genesis,
            expectedOldRoot,
            batches,
            sequencerAddress,
            oldAccInputHash,
        } = genInput;

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
            testvectorsGlobalConfig.forkID,
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
            updateTestVectors[0].expectedOldRoot = smtUtils.h4toString(zkEVMDB.stateRoot);
            genInput.expectedOldRoot = smtUtils.h4toString(zkEVMDB.stateRoot);
        }

        /*
             * build, sign transaction and generate rawTxs
             * rawTxs would be the calldata inserted in the contract
             */
        const txProcessed = [];
        for (let k = 0; k < batches.length; k++) {
            const {
                txs, expectedNewRoot, expectedNewLeafs, batchL2Data, historicGERRoot,
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
                    if (typeof txData.effectivePercentage === 'undefined') {
                        txData.effectivePercentage = '0xff';
                    }
                    customRawTx = signData.concat(r).concat(s).concat(v).concat(txData.effectivePercentage.slice);
                } else {
                    const rawTxEthers = await wallet.signTransaction(tx);
                    if (!update) {
                        expect(rawTxEthers).to.equal(txData.rawTx);
                    } else {
                        txData.rawTx = rawTxEthers;
                        updateTestVectors[0].batches[k].txs[j].rawTx = rawTxEthers;
                    }
                    customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);
                }

                if (!update) {
                    expect(customRawTx).to.equal(txData.customRawTx);
                } else {
                    txData.customRawTx = customRawTx;
                    updateTestVectors[0].batches[k].txs[j].customRawTx = customRawTx;
                }

                if (txData.encodeInvalidData) {
                    customRawTx = customRawTx.slice(0, -6);
                }
                rawTxs.push(customRawTx);
                txProcessed.push(txData);
            }
            const extraData = { GERS: {} };
            const batch = await zkEVMDB.buildBatch(
                timestamp,
                sequencerAddress,
                smtUtils.stringToH4(historicGERRoot),
                0,
                Constants.DEFAULT_MAX_TX,
                {
                    skipVerifyGER: true,
                },
                extraData,
            );

            const tx = {
                type: 11,
                deltaTimestamp: 1,
                newGER: '0x3100000000000000000000000000000000000000000000000000000000000000',
                indexHistoricalGERTree: 1,
                reason: '',
            };

            helpers.addRawTxChangeL2Block(batch, extraData, extraData, tx);

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
                updateTestVectors[0].batches[k].expectedNewRoot = smtUtils.h4toString(newRoot);
                genInput.batches[k].expectedNewRoot = smtUtils.h4toString(newRoot);
            }

            // Check errors on decode transactions
            const decodedTxInit = await batch.getDecodedTxs();
            const decodedTx = decodedTxInit.filter((txDecoded) => txDecoded.tx.type !== 11);
            for (let j = 0; j < decodedTx.length; j++) {
                if (!update) {
                    const currentTx = decodedTx[j];
                    const expectedTx = txProcessed[j];
                    try {
                        expect(currentTx.reason).to.be.equal(expectedTx.reason);
                    } catch (error) {
                        console.log({ currentTx }, { expectedTx }); // eslint-disable-line no-console
                        throw new Error(`Batch Id : ${id} TxId:${expectedTx.id} ${error}`);
                    }
                } else {
                    txs[j].reason = decodedTx[j].reason;
                    updateTestVectors[0].batches[k].txs[j].reason = decodedTx[j].reason;
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
                    if (storage !== null) {
                        newLeafs[address].storage = storage;
                    }
                }
            }
            for (const leaf of genesis) {
                const address = leaf.address.toLowerCase();
                if (!newLeafs[address]) {
                    newLeafs[address] = { ...leaf };
                    const storage = await zkEVMDB.dumpStorage(address);
                    if (storage !== null) {
                        newLeafs[address].storage = storage;
                    } else {
                        delete newLeafs[address].storage;
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
                updateTestVectors[0].batches[k].expectedNewLeafs = newLeafs;
                genInput.batches[k].expectedNewLeafs = newLeafs;
            }
            // Check global and local exit roots
            const addressInstanceGlobalExitRoot = new Address(toBuffer(Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2));
            const localExitRootPosBuffer = toBuffer(ethers.utils.hexZeroPad(Constants.LOCAL_EXIT_ROOT_STORAGE_POS, 32));
            const globalExitRootPos = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [tx.newGER, Constants.GLOBAL_EXIT_ROOT_STORAGE_POS]);
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
            expect(timestampSmt).to.equal(Scalar.e(tx.deltaTimestamp));

            // Check the circuit input
            const circuitInput = await batch.getStarkInput();
            circuitInput.GERS = extraData.GERS;
            // Check the encode transaction match with the vector test
            if (!update) {
                expect(batchL2Data).to.be.equal(batch.getBatchL2Data());
                // Check the batchHashData and the input hash
                expect(batchHashData).to.be.equal(circuitInput.batchHashData);
                expect(inputHash).to.be.equal(circuitInput.inputHash);
                expect(newLocalExitRoot).to.be.equal(circuitInput.newLocalExitRoot);
            } else {
                updateTestVectors[0].batches[k].batchL2Data = batch.getBatchL2Data();
                updateTestVectors[0].batches[k].batchHashData = circuitInput.batchHashData;
                updateTestVectors[0].batches[k].inputHash = circuitInput.inputHash;
                updateTestVectors[0].batches[k].newLocalExitRoot = circuitInput.newLocalExitRoot;
                genInput.batches[k].batchL2Data = batch.getBatchL2Data();
                genInput.batches[k].batchHashData = circuitInput.batchHashData;
                genInput.batches[k].inputHash = circuitInput.inputHash;
                genInput.batches[k].newLocalExitRoot = circuitInput.newLocalExitRoot;
                console.log('WRITE: ', pathGenInput);
                await fs.writeFileSync(pathGenInput, JSON.stringify([genInput], null, 2));
                // Save outuput in file
                console.log('WRITE: ', pathGenTestVector);
                await fs.writeFileSync(pathGenTestVector, JSON.stringify(updateTestVectors, null, 2));
            }

            if (update) {
                console.log(`header_timestamp_${k}.json`);
                const pathOutput = path.join(pathInputExecutor, `header_timestamp_${k}.json`);
                await fs.writeFileSync(pathOutput, JSON.stringify(circuitInput, null, 2));
            }
        }
    });
});
