/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len, no-plusplus, guard-for-in */
/* eslint-disable import/no-dynamic-require, global-require */
const { Scalar } = require('ffjavascript');
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const { expect } = require('chai');
const { argv } = require('yargs');
const {
    Address, toBuffer,
} = require('ethereumjs-util');
const lodash = require('lodash');
const {
    MemDB, stateUtils, contractUtils, ZkEVMDB, processorUtils,
    getPoseidon, smtUtils, Constants,
} = require('@0xpolygonhermez/zkevm-commonjs');

const { calculateSnarkInput, calculateBatchHashData } = contractUtils;
const MerkleTreeBridge = require('@0xpolygonhermez/zkevm-commonjs').MTBridge;
const {
    getLeafValue,
} = require('@0xpolygonhermez/zkevm-commonjs').mtBridgeUtils;

const {
    ERC20PermitMock, GlobalExitRootManager, Bridge, ProofOfEfficiencyMock, VerifierRollupHelperMock,
} = require('@0xpolygonhermez/zkevm-contracts');

const contractsPolygonHermez = require('@0xpolygonhermez/zkevm-contracts');

const { pathTestVectors } = require('../../helpers/helpers');

const pathStateTransition = path.join(pathTestVectors, './state-transition/e2e/e2e.json');
const testE2E = JSON.parse(fs.readFileSync(pathStateTransition));

async function setNextBlockTimestamp(timestamp) {
    return (ethers.provider.send('evm_setNextBlockTimestamp', [timestamp]));
}

describe('Proof of efficiency test vectors', function () {
    this.timeout(0);

    let update;
    let poseidon;
    let F;

    let deployer;
    let aggregator;

    let verifierContract;
    let bridgeContract;
    let proofOfEfficiencyContract;
    let maticTokenContract;
    let globalExitRootManager;

    const maticTokenName = 'Matic Token';
    const maticTokenSymbol = 'MATIC';
    const maticTokenInitialBalance = ethers.utils.parseEther('20000000');

    const networkIDMainnet = 0;
    const networkIDRollup = 1;

    before(async () => {
        update = argv.update === true;
    });

    beforeEach('Deploy contract', async () => {
        // build poseidon
        poseidon = await getPoseidon();
        F = poseidon.F;

        // load signers
        [deployer, aggregator] = await ethers.getSigners();

        // deploy mock verifier
        const VerifierRollupHelperFactory = new ethers.ContractFactory(VerifierRollupHelperMock.abi, VerifierRollupHelperMock.bytecode, deployer);
        verifierContract = await VerifierRollupHelperFactory.deploy();

        // deploy MATIC
        const maticTokenFactory = new ethers.ContractFactory(ERC20PermitMock.abi, ERC20PermitMock.bytecode, deployer);
        maticTokenContract = await maticTokenFactory.deploy(
            maticTokenName,
            maticTokenSymbol,
            deployer.address,
            maticTokenInitialBalance,
        );
        await maticTokenContract.deployed();

        // deploy global exit root manager
        const globalExitRootManagerFactory = new ethers.ContractFactory(GlobalExitRootManager.abi, GlobalExitRootManager.bytecode, deployer);
        globalExitRootManager = await globalExitRootManagerFactory.deploy();
        await globalExitRootManager.deployed();

        // deploy bridge
        const bridgeFactory = new ethers.ContractFactory(Bridge.abi, Bridge.bytecode, deployer);
        bridgeContract = await bridgeFactory.deploy();
        await bridgeContract.deployed();

        // deploy proof of efficiency
        const allowForcebatches = true;
        const urlSequencer = 'https://testURl';

        const ProofOfEfficiencyFactory = new ethers.ContractFactory(ProofOfEfficiencyMock.abi, ProofOfEfficiencyMock.bytecode, deployer);
        proofOfEfficiencyContract = await ProofOfEfficiencyFactory.deploy();
        await proofOfEfficiencyContract.deployed();

        await globalExitRootManager.initialize(proofOfEfficiencyContract.address, bridgeContract.address);
        await bridgeContract.initialize(networkIDMainnet, globalExitRootManager.address);
        await proofOfEfficiencyContract.initialize(
            globalExitRootManager.address,
            maticTokenContract.address,
            verifierContract.address,
            testE2E.expectedOldRoot,
            testE2E.sequencerAddress,
            allowForcebatches,
            urlSequencer,
            1000,
            'matic',
        );
    });
    it('End to end test', async () => {
        const {
            genesis,
            expectedOldRoot,
            txs,
            expectedNewRoot,
            sequencerAddress,
            expectedNewLeafs,
            batchL2Data,
            newLocalExitRoot,
            globalExitRoot,
            batchHashData,
            newAccInputHash,
            oldAccInputHash,
            timestamp,
            bridgeDeployed,
            sequencerPvtKey,
            chainID,
        } = testE2E;

        /*
        * /////////////////////////////////////////////////
        * // User interact with the bridge
        * /////////////////////////////////////////////////
        */

        // Add a claim leaf to rollup exit tree
        const claimAddress = '0xC949254d682D8c9ad5682521675b8F43b102aec4';
        const originNetwork = networkIDMainnet;
        const tokenAddress = ethers.constants.AddressZero; // ether
        const amount = ethers.utils.parseEther('10');
        const destinationNetwork = networkIDRollup;
        const destinationAddress = claimAddress;
        const emptyPermit = '0x';

        const metadata = '0x';// since is ether does not have metadata
        const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);

        const depositCount = 0;
        const mainnetRoot = '0x5ba002329b53c11a2f1dfe90b11e031771842056cf2125b43da8103c199dcd7f';
        let lastGlobalExitRootNum = 0;

        await expect(bridgeContract.bridgeAsset(tokenAddress, destinationNetwork, destinationAddress, amount, emptyPermit, { value: amount }))
            .to.emit(bridgeContract, 'BridgeEvent')
            .withArgs(Constants.BRIDGE_LEAF_TYPE_ASSET, originNetwork, tokenAddress, destinationNetwork, destinationAddress, amount, metadata, depositCount)
            .to.emit(globalExitRootManager, 'UpdateGlobalExitRoot')
            .withArgs(++lastGlobalExitRootNum, mainnetRoot, ethers.constants.HashZero);

        /*
        * /////////////////////////////////////////////////
        * // Fund trusted sequencer
        * /////////////////////////////////////////////////
        */
        const walletSequencer = new ethers.Wallet(sequencerPvtKey, ethers.provider);

        // fund sequencer address with Matic tokens and ether
        await maticTokenContract.transfer(sequencerAddress, ethers.utils.parseEther('100'));
        await deployer.sendTransaction({
            to: sequencerAddress,
            value: ethers.utils.parseEther('10.0'),
        });

        /*
        * /////////////////////////////////////////////////
        * // Build batch
        * /////////////////////////////////////////////////
        */

        // eslint-disable-next-line no-loop-func
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
        const addressToContractInterface = {};
        for (const contract of genesis) {
            if (contract.contractName) {
                // Add contract interface for future contract interaction
                if (contractsPolygonHermez[contract.contractName]) {
                    const contractInterface = new ethers.utils.Interface(contractsPolygonHermez[contract.contractName].abi);
                    addressToContractInterface[contract.address] = contractInterface;
                } else {
                    const contractInterface = new ethers.utils.Interface(contract.abi);
                    addressToContractInterface[contract.address] = contractInterface;
                }
                const contractAddres = new Address(toBuffer(contract.address));

                const contractAccount = await zkEVMDB.vm.stateManager.getAccount(contractAddres);
                expect(await contractAccount.isContract()).to.be.equal(true);

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
            testE2E.expectedOldRoot = smtUtils.h4toString(zkEVMDB.stateRoot);
        }

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
                value: processorUtils.toHexStringRlp(ethers.utils.parseUnits(txData.value, 'wei')),
                gasLimit: txData.gasLimit,
                gasPrice: processorUtils.toHexStringRlp(ethers.utils.parseUnits(txData.gasPrice, 'wei')),
                chainId: txData.chainId,
                data: txData.data || '0x',
            };

            if (txData.data) {
                if (txData.to) {
                    if (txData.contractName) {
                        const functionData = addressToContractInterface[txData.to].encodeFunctionData(txData.function, txData.params);
                        if (!update) {
                            expect(functionData).to.equal(txData.data);
                        } else {
                            txData.data = functionData;
                            tx.data = functionData;
                        }
                    }
                }
            }

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
            testE2E.expectedNewRoot = smtUtils.h4toString(newRoot);
        }

        // Check errors on decode transactions
        const decodedTx = await batch.getDecodedTxs();

        for (let j = 0; j < decodedTx.length; j++) {
            const currentTx = decodedTx[j];
            const expectedTx = txProcessed[j];
            try {
                expect(currentTx.reason).to.be.equal(expectedTx.reason);
            } catch (error) {
                console.log({ currentTx }, { expectedTx }); // eslint-disable-line no-console
                throw new Error(`TxId:${expectedTx.id} ${error}`);
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

            const storage = await zkEVMDB.dumpStorage(address);
            const hashBytecode = await zkEVMDB.getHashBytecode(address);
            const bytecodeLength = await zkEVMDB.getLength(address);
            newLeafs[address].storage = storage;
            newLeafs[address].hashBytecode = hashBytecode;
            newLeafs[address].bytecodeLength = bytecodeLength;
        }
        for (const leaf of genesis) {
            if (!newLeafs[leaf.address.toLowerCase()]) {
                newLeafs[leaf.address] = { ...leaf };
                delete newLeafs[leaf.address].address;
                delete newLeafs[leaf.address].bytecode;
                delete newLeafs[leaf.address].contractName;
            }
        }

        if (!update) {
            for (const [address, leaf] of Object.entries(expectedNewLeafs)) {
                expect(lodash.isEqual(leaf, newLeafs[address])).to.be.equal(true);
            }
        } else {
            testE2E.expectedNewLeafs = newLeafs;
        }

        // Check global and local exit roots
        const addressInstanceGlobalExitRoot = new Address(toBuffer(Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2));
        const localExitRootPosBuffer = toBuffer(ethers.utils.hexZeroPad(Constants.LOCAL_EXIT_ROOT_STORAGE_POS, 32));
        const globalExitRootPos = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [globalExitRoot, Constants.GLOBAL_EXIT_ROOT_STORAGE_POS]);
        const globalExitRootPosBuffer = toBuffer(globalExitRootPos);

        // Check local exit root
        const localExitRootVm = await zkEVMDB.vm.stateManager.getContractStorage(addressInstanceGlobalExitRoot, localExitRootPosBuffer);
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
        const batchNumVm = await zkEVMDB.vm.stateManager.getContractStorage(
            addressInstanceGlobalExitRoot,
            globalExitRootPosBuffer,
        );
        const batchNumSmt = (await stateUtils.getContractStorage(
            Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2,
            zkEVMDB.smt,
            zkEVMDB.stateRoot,
            [globalExitRootPos],
        ))[Scalar.e(globalExitRootPos)];

        expect(Scalar.fromString(batchNumVm.toString('hex'), 16)).to.equal(batchNumSmt);
        expect(batchNumSmt).to.equal(Scalar.e(batch.newNumBatch));

        // Check through a call in the EVM
        if (bridgeDeployed) {
            const interfaceGlobal = new ethers.utils.Interface(['function globalExitRootMap(bytes32)']);
            const encodedData = interfaceGlobal.encodeFunctionData('globalExitRootMap', [globalExitRoot]);
            const globalExitRootResult = await zkEVMDB.vm.runCall({
                to: addressInstanceGlobalExitRoot,
                caller: Address.zero(),
                data: Buffer.from(encodedData.slice(2), 'hex'),
            });
            expect(globalExitRootResult.execResult.returnValue.toString('hex')).to.be.equal(ethers.utils.hexZeroPad(batch.newNumBatch, 32).slice(2));
        }

        // Check the circuit input
        const circuitInput = await batch.getStarkInput();

        // Check the encode transaction match with the vector test
        if (!update) {
            expect(batchL2Data).to.be.equal(batch.getBatchL2Data());
            // Check the batchHashData and the input hash
            expect(batchHashData).to.be.equal(circuitInput.batchHashData);
            expect(newAccInputHash).to.be.equal(circuitInput.newAccInputHash);
            expect(oldAccInputHash).to.be.equal(circuitInput.oldAccInputHash);
            expect(newLocalExitRoot).to.be.equal(circuitInput.newLocalExitRoot);
        } else {
            testE2E.batchL2Data = batch.getBatchL2Data();
            testE2E.batchHashData = circuitInput.batchHashData;
            testE2E.newAccInputHash = circuitInput.newAccInputHash;
            testE2E.oldAccInputHash = circuitInput.oldAccInputHash;
            testE2E.newLocalExitRoot = circuitInput.newLocalExitRoot;
            // Write executor input
            const folderInputsExecutor = path.join(pathTestVectors, './inputs-executor/e2e');
            const fileName = path.join(folderInputsExecutor, 'e2e_0.json');
            await fs.writeFileSync(fileName, JSON.stringify(circuitInput, null, 2));
        }

        /*
         * /////////////////////////////////////////////////
         * // Check against the smart contracts
         * /////////////////////////////////////////////////
         */

        const currentStateRoot = `0x${Scalar.e(expectedOldRoot).toString(16).padStart(64, '0')}`;
        const newStateRoot = `0x${Scalar.e(expectedNewRoot).toString(16).padStart(64, '0')}`;
        const currentGlobalExitRoot = `0x${Scalar.e(globalExitRoot).toString(16).padStart(64, '0')}`;

        // sequencer send the batch
        const lastBatchSequenced = await proofOfEfficiencyContract.lastBatchSequenced();
        const l2txData = batchL2Data;
        const maticAmount = await proofOfEfficiencyContract.TRUSTED_SEQUENCER_FEE();

        await expect(
            maticTokenContract.connect(walletSequencer).approve(proofOfEfficiencyContract.address, maticAmount),
        ).to.emit(maticTokenContract, 'Approval');

        // set timestamp for the sendBatch call
        await setNextBlockTimestamp(timestamp);

        const sequence = {
            transactions: l2txData,
            globalExitRoot: currentGlobalExitRoot,
            timestamp,
            minForcedTimestamp: 0,
        };
        await expect(proofOfEfficiencyContract.connect(walletSequencer).sequenceBatches([sequence]))
            .to.emit(proofOfEfficiencyContract, 'SequenceBatches')
            .withArgs(lastBatchSequenced + 1);

        // check batch sent
        const accInputHash = await proofOfEfficiencyContract.sequencedBatches(1);

        expect(accInputHash).to.be.equal(circuitInput.newAccInputHash);
        const batchHashDataSC = calculateBatchHashData(
            l2txData,
        );
        expect(batchHashData).to.be.equal(batchHashDataSC);

        // Check inputs mathces de smart contract
        const numBatch = (await proofOfEfficiencyContract.lastVerifiedBatch()) + 1;
        const proofA = ['0', '0'];
        const proofB = [
            ['0', '0'],
            ['0', '0'],
        ];
        const proofC = ['0', '0'];

        // calculate circuit input
        const nextSnarkInput = await proofOfEfficiencyContract.getNextSnarkInput(
            numBatch - 1,
            numBatch,
            newLocalExitRoot,
            newStateRoot,
        );

        // Compute Js input
        const circuitInputJS = await calculateSnarkInput(
            currentStateRoot,
            newStateRoot,
            newLocalExitRoot,
            oldAccInputHash,
            circuitInput.newAccInputHash,
            numBatch - 1,
            numBatch,
            chainID,
            deployer.address,
        );
        const nextSnarkInputHex = `0x${Scalar.e(nextSnarkInput).toString(16).padStart(64, '0')}`;
        const circuitInputJSHex = `0x${Scalar.e(circuitInputJS).toString(16).padStart(64, '0')}`;
        expect(nextSnarkInputHex).to.be.equal(circuitInputJSHex);

        // Forge the batch
        const initialAggregatorMatic = await maticTokenContract.balanceOf(
            await aggregator.address,
        );

        await expect(
            proofOfEfficiencyContract.connect(aggregator).verifyBatches(
                numBatch - 1,
                numBatch,
                newLocalExitRoot,
                newStateRoot,
                proofA,
                proofB,
                proofC,
            ),
        ).to.emit(proofOfEfficiencyContract, 'VerifyBatch')
            .withArgs(numBatch, aggregator.address)
            .to.emit(globalExitRootManager, 'UpdateGlobalExitRoot')
            .withArgs(++lastGlobalExitRootNum, mainnetRoot, newLocalExitRoot);

        const finalAggregatorMatic = await maticTokenContract.balanceOf(
            await aggregator.address,
        );
        expect(finalAggregatorMatic).to.equal(
            ethers.BigNumber.from(initialAggregatorMatic).add(ethers.BigNumber.from(maticAmount)),
        );

        /*
        * /////////////////////////////////////////////////
        * //Claim funds from L2
        * /////////////////////////////////////////////////
        */

        // Add a claim leaf to rollup exit tree
        const originNetworkClaim = networkIDMainnet;
        const tokenAddressClaim = ethers.constants.AddressZero; // ether
        const amountClaim = ethers.utils.parseEther('1');
        const destinationNetworkClaim = networkIDMainnet;
        const destinationAddressClaim = claimAddress;

        // pre compute root merkle tree in Js
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
        const leafValue = getLeafValue(
            Constants.BRIDGE_LEAF_TYPE_ASSET,
            originNetworkClaim,
            tokenAddressClaim,
            destinationNetworkClaim,
            destinationAddressClaim,
            amountClaim,
            metadataHash,
        );
        merkleTree.add(leafValue);
        const rollupExitRoot = merkleTree.getRoot();
        expect(newLocalExitRoot).to.be.equal(rollupExitRoot);

        const index = 0;
        const proof = merkleTree.getProofTreeByIndex(index);
        await expect(bridgeContract.claimAsset(
            proof,
            index,
            mainnetRoot,
            rollupExitRoot,
            originNetworkClaim,
            tokenAddressClaim,
            destinationNetworkClaim,
            destinationAddressClaim,
            amountClaim,
            metadata,
        ))
            .to.emit(bridgeContract, 'ClaimEvent')
            .withArgs(
                index,
                originNetworkClaim,
                tokenAddressClaim,
                destinationAddressClaim,
                amountClaim,
            );
    });

    after(async () => {
        if (update) {
            fs.writeFileSync(pathStateTransition, JSON.stringify(testE2E, null, 2));
        }
    });
});
