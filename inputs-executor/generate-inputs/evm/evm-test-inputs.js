const VM = require("@ethereumjs/vm").default;
const Common = require("@ethereumjs/common").default;
const { Chain, Hardfork } = require("@ethereumjs/common");
const { Address, Account, BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');

const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin });
let vm = new VM({ common });
let vm2 = new VM({ common });

const zkcommonjs = require("@polygon-hermez/zkevm-commonjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;
const { expect } = require("chai");
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require("fs");
const path = require("path");
const helpers = require("../helpers");
const artifactsPath = path.join(__dirname, "artifacts/contracts");

//example: npx mocha evm-test-inputs.js --vectors txs-calldata

describe("Deploy and interact with TEST in the EVMjs", async function () {
    this.timeout(20000);
    let poseidon;
    let F;
    let sequencerFees = 0;
    let inputName;

    before(async () => {
        poseidon = await buildPoseidon();
        F = poseidon.F;
    });

    it("load test vectors", async () => {
        let file = (argv.vectors) ? argv.vectors : 'txs-calldata.json';
        file = file.endsWith('.json') ? file : file + '.json';
        switch (file) {
            case 'txs-calldata.json':
                inputName = 'input_txs_';
                break;
            default:
                inputName = 'input_'
        }
        testVectors = require(`../../../test-vector-data/${file}`);

        await hre.run("compile");
    });

    it("Should check test vectors", async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const output = {};
            const {
                id,
                sequencerAddress,
                arity,
                genesis,
                expectedOldRoot,
                txs,
                expectedNewRoot,
                chainIdSequencer,
                expectedNewLeafs,
                timestamp
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            if(!genesis.accounts){
                console.log("Error: account genesis required");
                process.exit(1);
            }

            const accountDeploy = genesis.accounts[0];
            const contracts = [];
            if(genesis.contracts) {
                //Create account with balance
                const accountPk = toBuffer(accountDeploy.pvtKey);
                const accountAddress = Address.fromPrivateKey(accountPk);
                const acctDataDeploy = {
                    nonce: 0,
                    balance: new BN(10).pow(new BN(18)), // 1 eth
                }
                const account = Account.fromAccountData(acctDataDeploy);
                await vm.stateManager.putAccount(accountAddress, account);

                for(let i = 0; i < genesis.contracts.length; i++){
                    const contractName = genesis.contracts[i].contractName;
                    const { abi, bytecode } = require(`${artifactsPath}/${contractName}.sol/${contractName}.json`);
                    const interface = new ethers.utils.Interface(abi);
                    const contractAddress = await helpers.deployContract(vm, accountPk, bytecode);
                    const contract = {
                        contractName,
                        bytecode,
                        contractAddress,
                        interface
                    };
                    contracts.push(contract);
                }
            }

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const smt = new zkcommonjs.SMT(db, arity, poseidon, poseidon.F);
            let root = F.zero;

            // NEW VM
            // setup new VM

            let newRoot = root;
            // add accounts
            for(let i = 0; i < genesis.accounts.length; i++) {
                const {address, balance, nonce} = genesis.accounts[i];
                const evmAddr = new Address(toBuffer(address));
                const acctData = {
                    nonce: Number(nonce),
                    balance: new BN(balance), // 1 eth
                }
                const account = Account.fromAccountData(acctData);
                await vm2.stateManager.putAccount(evmAddr, account);
                // Update SMT
                newRoot = await zkcommonjs.stateUtils.setAccountState(address, smt, newRoot, acctData.balance, acctData.nonce);
            }
            // add contract account
            // add contract bytecode
            for(let i = 0; i < genesis.contracts.length; i ++) {
                const sto = await vm.stateManager.dumpStorage(contracts[i].contractAddress);
                const smCode = await vm.stateManager.getContractCode(contracts[i].contractAddress);

                const accountContract = {
                    nonce: 0,
                    balance: 0,
                }
                const smAcc = Account.fromAccountData(accountContract);
                await vm2.stateManager.putAccount(contracts[i].contractAddress, smAcc);
                await vm2.stateManager.putContractCode(contracts[i].contractAddress, smCode);

                // add contract storage
                const keys = Object.keys(sto).map(v => toBuffer("0x" + v));
                const values = Object.values(sto).map(v => toBuffer("0x" + v));

                for (let j = 0; j < keys.length; j++){
                    await vm2.stateManager.putContractStorageRaw(contracts[i].contractAddress, keys[j], values[j]);
                }
                newRoot = await zkcommonjs.stateUtils.setContractBytecode(contracts[i].contractAddress, smt, newRoot, contracts[i].bytecode);

                const sto2 = await vm2.stateManager.dumpStorage(contracts[i].contractAddress);
                let storage2 = {};

                const keys2 = Object.keys(sto2).map(v => "0x" + v);
                const values2 = Object.values(sto2).map(v => "0x" + v);
                for (let i = 0; i < keys2.length; i++) {
                    storage2[keys2[i]] = values2[i];
                }
                newRoot = await zkcommonjs.stateUtils.setContractStorage(contracts[i].contractAddress, smt, newRoot, storage2);
            }
            expect(F.toString(newRoot)).to.be.equal(expectedOldRoot);

            output.oldStateRoot = helpers.stringToHex32(expectedOldRoot, true);
            output.chainId = chainIdSequencer;
            output.db = await helpers.getSMT(newRoot, db, F);
            output.sequencerAddr = sequencerAddress;

            const txsList = [];

            for(let j = 0; j < txs.length; j++) {
                let txData;
                const accountFrom = genesis.accounts.filter(x => x.address.toLowerCase() == txs[j].from.toLowerCase())[0];
                const accountAddressFrom = new Address(toBuffer(accountFrom.address));
                const accountPkFrom = toBuffer(accountFrom.pvtKey);
                let accountAddressTo;

                if(txs[j].to == "contract") {
                    const contract = contracts.filter(x => x.contractName == txs[j].contractName)[0];
                    const functionData = contract.interface.encodeFunctionData(txs[i].function, txs[i].params);
                    txData = {
                        to: contract.contractAddress,
                        value: new BN(txs[j].value),
                        gasLimit: new BN(txs[j].gasLimit),
                        gasPrice: new BN(txs[j].gasPrice),
                        data: functionData,
                        nonce: Number(txs[j].nonce),
                    }
                    accountAddressTo = new Address(toBuffer(contract.contractAddress));
                } else {
                    txData = {
                        to: txs[j].to,
                        nonce: Number(txs[j].nonce),
                        value: new BN(txs[j].value),
                        gasLimit: new BN(txs[j].gasLimit),
                        gasPrice: new BN(txs[j].gasPrice),
                    }
                    accountAddressTo = new Address(toBuffer(txData.to));
                }

                const tx = Transaction.fromTxData(txData).sign(accountPkFrom);
                const resultTx = await vm2.runTx({ tx });

                const sign = !(Number(tx.v) & 1);
                const chainId = (Number(tx.v) - 35) >> 1;
                let messageToHash = [
                    tx.nonce.toString(16),
                    tx.gasPrice.toString(16),
                    tx.gasLimit.toString(16),
                    tx.to.toString(16),
                    tx.value.toString(16),
                    tx.data.toString("hex"),
                    ethers.utils.hexlify(chainId),
                    "0x",
                    "0x"
                ];
                for(let j = 0; j < messageToHash.length; j++) {
                    const param = messageToHash[j];
                    let newParam = param;
                    if(param == "0")
                        newParam = "0x"
                    else if (param.length % 2 != 0)
                        newParam = newParam.startsWith("0x") ? "0x0" + newParam.slice(2) : "0x0" + newParam;
                    else
                        newParam = newParam.startsWith("0x") ? newParam : "0x" + newParam;
                    messageToHash[j] = newParam;
                }
                const signData = ethers.utils.RLP.encode(messageToHash).slice(2);
                const r = tx.r.toString(16).padStart(32 * 2, '0');
                const s = tx.s.toString(16).padStart(32 * 2, '0');
                const v = (sign + 27).toString(16).padStart(1 * 2, '0');
                const calldata = `0x${signData.concat(r).concat(s).concat(v)}`;
                txsList.push(calldata);

                //Sub fees&value from sender
                const acctDataFrom = await vm2.stateManager.getAccount(accountAddressFrom);
                newRoot = await zkcommonjs.stateUtils.setAccountState(accountAddressFrom, smt, newRoot, acctDataFrom.balance, acctDataFrom.nonce);

                //Update account receiver
                const acctDataTo = await vm2.stateManager.getAccount(accountAddressTo);
                newRoot = await zkcommonjs.stateUtils.setAccountState(accountAddressTo, smt, newRoot, acctDataTo.balance, acctDataTo.nonce);

                //Add fees to sequencer
                const gasUsed = resultTx.gasUsed;
                const gasPrice = txs[j].gasPrice;
                sequencerFees = Scalar.mul(gasUsed, gasPrice);

                const seqAddr = new Address(toBuffer(sequencerAddress));
                const seqAcc = await vm2.stateManager.getAccount(seqAddr);
                const seqAccData = {
                    nonce: seqAcc.nonce,
                    balance: new BN(Scalar.add(sequencerFees, seqAcc.balance)),
                };
                await vm2.stateManager.putAccount(seqAddr, Account.fromAccountData(seqAccData));
                newRoot = await zkcommonjs.stateUtils.setAccountState(sequencerAddress, smt, newRoot, seqAccData.balance, seqAccData.nonce);

                //Update contract storage
                const sto3 = await vm2.stateManager.dumpStorage(contracts[i].contractAddress);
                let storage3 = {};

                const keys3 = Object.keys(sto3).map(v => "0x" + v);
                const values3 = Object.values(sto3).map(v => "0x" + v);
                for (let i = 0; i < keys3.length; i++) {
                    storage3[keys3[i]] = values3[i];
                }
                newRoot = await zkcommonjs.stateUtils.setContractStorage(contracts[i].contractAddress, smt, newRoot, storage3);
            }

            let batchL2Data = "0x";
            for (let j = 0; j < txsList.length; j++) {
                batchL2Data = batchL2Data.concat(txsList[j].slice(2));
            }
            output.batchL2Data = batchL2Data;

            //Check new root
            expect(F.toString(newRoot)).to.be.equal(expectedNewRoot);

            //TODO: delete
            //Check balances and nonces
            for (const [address, leaf] of Object.entries(expectedNewLeafs)) {
                const newLeaf = await zkcommonjs.stateUtils.getState(address, smt, newRoot);
                expect(newLeaf.balance.toString()).to.equal(leaf.balance);
                expect(newLeaf.nonce.toString()).to.equal(leaf.nonce);
            }

            output.newStateRoot = helpers.stringToHex32(expectedNewRoot, true);
            output.globalExitRoot = "0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9";
            output.newLocalExitRoot = "0x17c04c3760510b48c6012742c540a81aba4bca2f78b9d14bfd2f123e2e53ea3e";
            output.oldLocalExitRoot = "0x17c04c3760510b48c6012742c540a81aba4bca2f78b9d14bfd2f123e2e53ea3e";
            output.numBatch = 1;
            if(timestamp)
                output.timestamp = timestamp;
            else
                output.timestamp = 1944498032;
            if (!output.batchL2Data)
                output.batchL2Data = "0x";

            output.batchHashData = zkcommonjs.contractUtils.calculateBatchHashData(
                output.batchL2Data,
                output.globalExitRoot,
                output.timestamp,
                sequencerAddress,
                output.chainId
            );

            // Save outuput in file
            const dir = path.join(__dirname, '../../inputs/');
            await fs.writeFileSync(`${dir}${inputName}${id}.json`, JSON.stringify(output, null, 2));
        }
    });
});

