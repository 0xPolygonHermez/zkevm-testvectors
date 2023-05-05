/* eslint-disable no-console */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
const VM = require('@polygon-hermez/vm').default;
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const {
    Address, Account, BN, toBuffer,
} = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const helpers = require('../../helpers/helpers');

const artifactsPath = path.join(__dirname, '../artifacts/contracts');

const testAccountDeploy = {
    pvtKey: '0x28b2b0318721be8c8339199172cd7cc8f5e273800a35616ec893083a4b32c02e',
};

// example: npx mocha gen-test-vectors-evm.js --vectors txs-calldata

describe('Generate test-vectors from generate-test-vectors', async function () {
    this.timeout(100000);
    let outputName;
    const testVectorDataPath = './sources/';
    let listTestVectors;
    let testVectors;
    let outputTestVector;
    let output = [];

    it('Load generate test vectors', async () => {
        listTestVectors = fs.readdirSync('./gen-sources');
    });

    it('Generate new test vectors', async () => {
        for (let s = 0; s < listTestVectors.length; s++) {
            testVectors = require(`./gen-sources/${listTestVectors[s]}`);
            output = [];
            for (let i = 0; i < testVectors.length; i++) {
                outputTestVector = testVectors[i];
                const {
                    id,
                    genesis,
                    txs,
                    defaultChainId,
                    expectedNewLeafs,
                } = testVectors[i];

                if (expectedNewLeafs) {
                    outputTestVector.expectedNewLeafs = expectedNewLeafs;
                } else {
                    outputTestVector.expectedNewLeafs = {};
                }

                console.log(`executing test-vector id: ${id}`);

                const common = Common.custom({ chainId: defaultChainId }, { hardfork: Hardfork.Berlin });
                const vm = new VM({ common, allowUnlimitedContractSize: true });

                const auxGenesis = [];

                for (let j = 0; j < genesis.accounts.length; j++) {
                    const {
                        address, balance, nonce, pvtKey, bytecode, storage,
                    } = genesis.accounts[j];
                    if (outputTestVector.expectedNewLeafs[address] === undefined) {
                        outputTestVector.expectedNewLeafs[address] = {};
                    }
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

                        if (outputTestVector.expectedNewLeafs[contractAddress.toString('hex')] === undefined) {
                            outputTestVector.expectedNewLeafs[contractAddress.toString('hex')] = {};
                        }
                    }
                }

                const auxTxs = [];

                for (let j = 0; j < txs.length; j++) {
                    const currentTx = txs[j];
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
                        };
                        if (currentTx.rawTx) { outputTx.rawTx = currentTx.rawTx; }
                        if (currentTx.customRawTx) { outputTx.customRawTx = currentTx.customRawTx; }
                    } else if (currentTx.to === 'deploy') {
                        const { contractName } = currentTx;
                        const { abi, bytecode, deployedBytecode } = require(`${artifactsPath}/${contractName}.sol/${contractName}.json`);
                        const interfaceContract = new ethers.utils.Interface(abi);
                        let params = '';
                        if (currentTx.params.length > 0) { params = interfaceContract.encodeDeploy(currentTx.params); }
                        const functionData = bytecode + params.slice(2);
                        outputTx = {
                            from: currentTx.from,
                            to: '0x',
                            nonce: currentTx.nonce,
                            value: currentTx.value,
                            data: functionData,
                            gasLimit: currentTx.gasLimit,
                            gasPrice: currentTx.gasPrice,
                            chainId: currentTx.chainId,
                            deployedBytecode,
                        };
                        const contractAddress = ethers.utils.getContractAddress(outputTx);
                        if (outputTestVector.expectedNewLeafs[contractAddress.toString('hex')] === undefined) {
                            outputTestVector.expectedNewLeafs[contractAddress.toString('hex')] = {};
                        }
                        const contract = {
                            contractName,
                            contractAddress,
                            interfaceContract,
                            bytecode: deployedBytecode,
                        };
                        contracts.push(contract);
                    } else if (currentTx.to === 'deploy-custom') {
                        outputTx = {
                            from: currentTx.from,
                            to: '0x',
                            nonce: currentTx.nonce,
                            value: currentTx.value,
                            data: currentTx.data,
                            gasLimit: currentTx.gasLimit,
                            gasPrice: currentTx.gasPrice,
                            chainId: currentTx.chainId,
                            deployedBytecode: currentTx.deployedBytecode,
                        };
                        const contractAddress = ethers.utils.getContractAddress(outputTx);
                        if (outputTestVector.expectedNewLeafs[contractAddress.toString('hex')] === undefined) {
                            outputTestVector.expectedNewLeafs[contractAddress.toString('hex')] = {};
                        }
                    } else {
                        outputTx = currentTx;
                    }
                    auxTxs.push(outputTx);
                }
                outputTestVector.genesis = auxGenesis;
                outputTestVector.txs = auxTxs;
                output.push(outputTestVector);
            }
            // Save outuput in file
            const dir = path.join(__dirname, testVectorDataPath);
            console.log('WRITE: ', `${dir}${listTestVectors[s].substring(4)}`);
            await fs.writeFileSync(`${dir}${listTestVectors[s].substring(4)}`, JSON.stringify(output, null, 2));
        }
    });
});
