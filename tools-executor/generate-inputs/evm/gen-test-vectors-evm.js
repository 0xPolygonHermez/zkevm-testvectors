const VM = require("@polygon-hermez/vm").default;
const Common = require("@ethereumjs/common").default;
const { Chain, Hardfork } = require("@ethereumjs/common");
const { Address, Account, BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');

const { argv } = require('yargs');
const fs = require("fs");
const path = require("path");
const helpers = require("../helpers/helpers");
const artifactsPath = path.join(__dirname, "artifacts/contracts");

const testAccountDeploy = {
    "pvtKey": "0x28b2b0318721be8c8339199172cd7cc8f5e273800a35616ec893083a4b32c02e",
  }

//example: npx mocha gen-test-vectors-evm.js --vectors txs-calldata

describe("Generate test-vectors from generate-test-vectors", async function () {
    this.timeout(20000);
    let outputName;
    let update;
    let testVectorDataPath;
    const output = [];

    it("Load generate test vectors", async () => {
        update = (argv.update) ? true : false;
        let file = (argv.vectors) ? argv.vectors : process.exit(0);
        file = file.endsWith('.json') ? file : file + '.json';
        outputName = file.replace("gen-", "");
        genTestVectorPath = `./generate-test-vectors/${file}`;
        testVectors = require(genTestVectorPath);
        testVectorDataPath = `../../../test-vector-data/`;
        await hre.run("compile");
    });

    it("Generate new test vectors", async () => {
        for (let i = 0; i < testVectors.length; i++) {
            outputTestVector = testVectors[i];
            let {
                id,
                genesis,
                txs,
                chainIdSequencer,
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            const common = Common.custom({ chainId: chainIdSequencer, hardfork: Hardfork.Berlin });
            let vm = new VM({ common });

            const auxGenesis = [];

            for(let j = 0; j < genesis.accounts.length; j++) {
                const {address, balance, nonce, pvtKey} = genesis.accounts[j];
                auxGenesis.push({
                    address,
                    nonce,
                    balance,
                    pvtKey
                })
            }

            const contracts = [];
            if(genesis.contracts) {
                //Create account with balance
                const accountPk = toBuffer(testAccountDeploy.pvtKey);
                const accountAddress = Address.fromPrivateKey(accountPk);
                const acctDataDeploy = {
                    nonce: 0,
                    balance: new BN(10).pow(new BN(18)), // 1 eth
                }
                const account = Account.fromAccountData(acctDataDeploy);
                await vm.stateManager.putAccount(accountAddress, account);
                //Deploy contracts
                for(let j = 0; j < genesis.contracts.length; j++){
                    const contractName = genesis.contracts[j].contractName;
                    const { abi, bytecode, deployedBytecode } = require(`${artifactsPath}/${contractName}.sol/${contractName}.json`);
                    const interface = new ethers.utils.Interface(abi);
                    const contractAddress = await helpers.deployContract(vm, accountPk, bytecode);
                    const accountContract = {
                        nonce: 1,
                        balance: 0,
                    }
                    const contract = {
                        contractName,
                        contractAddress,
                        interface,
                        deployedBytecode
                    };
                    contracts.push(contract);

                    const sto = await vm.stateManager.dumpStorage(contract.contractAddress);
                    let storage = {}
                    // add contract storage
                    const keys = Object.keys(sto).map(v => toBuffer("0x" + v));
                    const values = Object.values(sto).map(v => toBuffer("0x" + v));
                    for (let k = 0; k < keys.length; k++) {
                        storage["0x" + keys[k].toString("hex")] = "0x" + values[k].toString("hex");
                    }

                    auxGenesis.push({
                        address: contractAddress.toString("hex"),
                        nonce: accountContract.nonce,
                        balance: accountContract.balance,
                        deployedBytecode,
                        abi: abi,
                        storage
                    })
                }
            }

            const auxTxs = [];

            for(let j = 0; j < txs.length; j++) {
                let currentTx = txs[j];
                let outputTx = {}
                if(currentTx.to == "contract") {
                    const contract = contracts.filter(x => x.contractName == currentTx.contractName)[0];
                    const functionData = contract.interface.encodeFunctionData(currentTx.function, currentTx.params);
                    outputTx = {
                        from: currentTx.from,
                        to: contract.contractAddress.toString("hex"),
                        nonce: currentTx.nonce,
                        value: currentTx.value,
                        data: functionData,
                        gasLimit: currentTx.gasLimit,
                        gasPrice: currentTx.gasPrice,
                        chainId: currentTx.chainId
                    }
                    if(currentTx.rawTx)
                        outputTx.rawTx = current.rawTx;
                    if(currentTx.customRawTx)
                        outputTx.customRawTx = current.customRawTx;
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
        await fs.writeFileSync(`${dir}${outputName}`, JSON.stringify(output, null, 2));
    });
});

