const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const ethers = require("ethers");

const helpers = require("./helpers");
const zkcommonjs = require("@polygon-hermez/zkevm-commonjs");

const { argv } = require('yargs');
// Command: npx mocha ${test} --vectors ${fileName vectors}
// Example command: npx mocha state-transition.test.js --vectors chain-ids
describe("smt test vectors: key-genesis", async function () {
    let poseidon;
    let F;
    this.timeout(10000000);
    let testVectors;
    let inputName;

    before(async () => {
        poseidon = await buildPoseidon();
        F = poseidon.F;
    });

    after(async () => {
        process.exit(0)
    });

    it("load test vectors", async () => {
        let file = (argv.vectors) ? argv.vectors : 'state-transition.json';
        file = file.endsWith('.json') ? file : file + '.json';
        switch (file) {
            case 'chain-ids.json':
                inputName = 'input_ci_';
                break;
            case 'nonces.json':
                inputName = 'input_n_';
                break;
            case 'balances.json':
                inputName = 'input_b_';
                break;
            case 'seq-fees.json':
                inputName = 'input_seq_fees_';
                break;
            default:
                inputName = 'input_'
        }

        testVectors = require(`../../test-vector-data/${file}`);
    });

    it("Should check test vectors", async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const output = {};
            const {
                id,
                sequencerAddress,
                sequencerPvtKey,
                arity,
                genesis,
                expectedOldRoot,
                txs,
                expectedNewRoot,
                chainIdSequencer,
                expectedNewLeafs,
                defaultChainId,
                timestamp
            } = testVectors[i];
            console.log(`Executing test-vector id: ${id}`);

            let newRoot;

            // check sequencer address and its private key
            const walletSeq = new ethers.Wallet(sequencerPvtKey);
            expect(sequencerAddress).to.be.equal(walletSeq.address);
            // wallets
            const wallets = {};

            // init SMT Db
            const db = new zkcommonjs.MemDB(F);
            const smt = new zkcommonjs.SMT(db, arity, poseidon, poseidon.F);

            // build genesis and load wallets
            let root = F.zero;
            for (let j = 0; j < genesis.length; j++) {
                const { address, pvtKey, balance, nonce } = genesis[j];

                const keyBalance = await zkcommonjs.smtUtils.keyEthAddrBalance(address, arity);
                const keyNonce = await zkcommonjs.smtUtils.keyEthAddrNonce(address, arity);

                let auxRes = await smt.set(root, keyBalance, Scalar.e(balance));
                auxRes = await smt.set(auxRes.newRoot, keyNonce, Scalar.e(nonce));
                root = auxRes.newRoot;

                wallets[address] = new ethers.Wallet(pvtKey);
            }
            expect(F.toString(root)).to.be.equal(expectedOldRoot);

            //Populate output
            output.oldStateRoot = helpers.stringToHex32(expectedOldRoot, true);
            output.chainId = chainIdSequencer;
            output.db = await helpers.getSMT(root, db, F);

            output.sequencerAddr = sequencerAddress;

            // build, sign transaction and generate rawTx
            // rawTx would be the calldata inserted in the contract
            const txsList = [];
            // parse Txs according ethereum
            // Checks transactions:
            // A: Well formed RLP encoding
            // A.2: Validate tx chain id
            // B: Valid signature
            // C: Valid nonce
            // D: Check upfront total tx cost "from": gasLimit*gasPrice + value
            // E: Collect sequencer fees

            for (let j = 0; j < txs.length; j++) {
                const txData = txs[j];
                let rawTx;

                //Check tx data
                if (!ethers.utils.isAddress(txData.from)) {
                    console.log("       TX INVALID: Invalid from address");
                    continue;
                }
                if (!ethers.utils.isAddress(txData.to)) {
                    console.log("       TX INVALID: Invalid to address");
                    continue;
                }
                const tx = {
                    to: txData.to,
                    nonce: txData.nonce,
                    value: ethers.utils.parseUnits(txData.value, "wei"),
                    gasLimit: txData.gasLimit,
                    gasPrice: ethers.utils.parseUnits(txData.gasPrice, "wei"),
                    chainId: txData.chainId,
                }

                rawTx = await wallets[txData.from].signTransaction(tx);
                if (!txData.overwrite)
                    expect(rawTx).to.equal(txData.rawTx)

                let isInvalid = false;

                // A: Well formed RLP encoding
                let txFields;
                let txDecoded;

                try {
                    txFields = ethers.utils.RLP.decode(rawTx);

                    txDecoded = {
                        nonce: txFields[0],
                        gasPrice: txFields[1],
                        gasLimit: txFields[2],
                        to: txFields[3],
                        value: txFields[4],
                        data: txFields[5],
                        v: txFields[6],
                        r: txFields[7],
                        s: txFields[8],
                    };

                    if (txData.overwrite) {
                        for (let paramOverwrite of Object.keys(txData.overwrite)) {
                            txDecoded[paramOverwrite] = txData.overwrite[paramOverwrite];
                            rawTx = ethers.utils.RLP.encode([
                                txDecoded.nonce,
                                txDecoded.gasPrice,
                                txDecoded.gasLimit,
                                txDecoded.to,
                                txDecoded.value,
                                txDecoded.data,
                                txDecoded.v,
                                txDecoded.r,
                                txDecoded.s
                            ]);
                            expect(rawTx).to.equal(txData.rawTx);
                        }
                    }
                    const sign = !(Number(txDecoded.v) & 1);
                    const chainId = (Number(txDecoded.v) - 35) >> 1;
                    const messageToHash = [txDecoded.nonce, txDecoded.gasPrice, txDecoded.gasLimit, txDecoded.to, txDecoded.value, txDecoded.data, ethers.utils.hexlify(chainId), "0x", "0x"];
                    const signData = ethers.utils.RLP.encode(messageToHash).slice(2);
                    const r = txDecoded.r.slice(2).padStart(32 * 2, 0);
                    const s = txDecoded.s.slice(2).padStart(32 * 2, 0);
                    const v = (sign + 27).toString(16).padStart(1 * 2, '0');
                    const calldata = `0x${signData.concat(r).concat(s).concat(v)}`;
                    txsList.push(calldata);
                } catch (error) {
                    console.log("       TX INVALID: Failed to RLP decode raw transaction");
                    isInvalid = true;
                }

                let batchL2Data = "0x";
                for (let i = 0; i < txsList.length; i++) {
                    batchL2Data = batchL2Data.concat(txsList[i].slice(2));
                }
                output.batchL2Data = batchL2Data;

                //A.2 Validate tx chain id
                let chainId = Math.floor((Number(txDecoded.v) - 35) / 2);
                if (!isInvalid) {

                    if (chainId !== chainIdSequencer && chainId !== defaultChainId) {
                        console.log("       TX INVALID: Invalid chain id");
                        isInvalid = true;
                    }
                }

                // B: Valid Signature
                let fromAddr = ethers.constants.AddressZero; //default address

                if (!isInvalid) {
                    const sign = Number(!(txDecoded.v & 1))
                    // build message hash according eip155
                    const e = [
                        txDecoded.nonce,
                        txDecoded.gasPrice,
                        txDecoded.gasLimit,
                        txDecoded.to,
                        txDecoded.value,
                        txDecoded.data,
                        ethers.utils.hexlify(chainId),
                        "0x",
                        "0x"
                    ];

                    const signData = ethers.utils.RLP.encode(e);
                    const digest = ethers.utils.keccak256(signData);

                    try {
                        fromAddr = ethers.utils.recoverAddress(digest, {
                            r: txDecoded.r,
                            s: txDecoded.s,
                            v: sign + 27
                        });
                    } catch (error) {
                        console.log("       TX INVALID: Failed signature");
                        isInvalid = true;
                    }
                }

                // get states from and to
                const oldStateFrom = await zkcommonjs.stateUtils.getState(fromAddr, smt, root);
                const oldStateTo = await zkcommonjs.stateUtils.getState(txDecoded.to, smt, root);

                // C: VALID NONCE
                if (!isInvalid) {
                    if (Number(oldStateFrom.nonce) !== Number(txDecoded.nonce == "0x" ? "0x0" : txDecoded.nonce)) {
                        console.log("       TX INVALID: Invalid nonce");
                        isInvalid = true;
                    }
                }

                // D: ENOUGH UPFRONT TX COST
                let totalGasCost;
                let totalCost;

                if (!isInvalid) {
                    // compute gas consumption
                    totalGasCost = Scalar.mul(Scalar.e(txDecoded.gasLimit), Scalar.e(txDecoded.gasPrice));
                    totalCost = Scalar.add(totalGasCost, Scalar.e(txDecoded.value));
                    if (Scalar.gt(totalCost, Scalar.e(oldStateFrom.balance))) {
                        console.log("       TX INVALID: Not enough funds to pay total transaction cost");
                        isInvalid = true;
                    }
                }

                // PROCESS TX
                // from: increase nonce
                // from: substract total tx cost
                // from: refund unused gas
                // to: increase balance
                if (!isInvalid) {
                    let newStateFrom;
                    if (fromAddr.toLocaleLowerCase() == txDecoded.to.toLocaleLowerCase()) {
                        newStateFrom = Object.assign({}, oldStateFrom);
                        newStateFrom.nonce = Scalar.add(newStateFrom.nonce, 1);
                        newStateFrom.balance = Scalar.sub(newStateFrom.balance, totalGasCost);
                        // hardcoded gas used for an ethereum tx: 21000
                        const gasUsed = Scalar.e(21000);
                        const refundGas = Scalar.sub(totalGasCost, Scalar.mul(gasUsed, txDecoded.gasPrice));
                        newStateFrom.balance = Scalar.add(newStateFrom.balance, refundGas);

                        newRoot = await zkcommonjs.stateUtils.setAccountState(fromAddr, smt, root, newStateFrom.balance, newStateFrom.nonce);
                    } else {
                        newStateFrom = Object.assign({}, oldStateFrom);
                        const newStateTo = Object.assign({}, oldStateTo);

                        newStateFrom.nonce = Scalar.add(newStateFrom.nonce, 1);
                        newStateFrom.balance = Scalar.sub(newStateFrom.balance, totalCost);

                        // hardcoded gas used for an ethereum tx: 21000
                        const gasUsed = Scalar.e(21000);
                        const refundGas = Scalar.sub(totalGasCost, Scalar.mul(gasUsed, txDecoded.gasPrice));
                        newStateFrom.balance = Scalar.add(newStateFrom.balance, refundGas);
                        newStateTo.balance = Scalar.add(newStateTo.balance, txDecoded.value);

                        newRoot = await zkcommonjs.stateUtils.setAccountState(fromAddr, smt, root, newStateFrom.balance, newStateFrom.nonce);
                        newRoot = await zkcommonjs.stateUtils.setAccountState(txDecoded.to, smt, newRoot, newStateTo.balance, newStateTo.nonce);
                    }
                    //Check smt setters and getters
                    const updatedStateFrom = await zkcommonjs.stateUtils.getState(fromAddr, smt, newRoot);
                    expect(updatedStateFrom.balance).to.equal(newStateFrom.balance);
                    expect(updatedStateFrom.nonce).to.equal(newStateFrom.nonce);
                    root = newRoot;
                }

                // E: Collect sequencer fees
                if (!isInvalid) {
                    const oldStateSeq = await zkcommonjs.stateUtils.getState(sequencerAddress, smt, root);
                    const newStateSeq = Object.assign({}, oldStateSeq);
                    const gasUsed = Scalar.e(21000);
                    const feesCollected = Scalar.mul(gasUsed, txDecoded.gasPrice);
                    newStateSeq.balance = Scalar.add(oldStateSeq.balance, feesCollected);

                    newRoot = await zkcommonjs.stateUtils.setAccountState(sequencerAddress, smt, root, newStateSeq.balance, newStateSeq.nonce);

                    //Make some checks
                    const updatedStateSeq = await zkcommonjs.stateUtils.getState(sequencerAddress, smt, newRoot);
                    expect(updatedStateSeq.balance).to.equal(newStateSeq.balance);
                    expect(updatedStateSeq.balance).to.equal(Scalar.add(oldStateSeq.balance, feesCollected));
                    console.log("       TX VALID");
                    root = newRoot;
                }
            }
            //Check new root
            expect(F.toString(root)).to.be.equal(expectedNewRoot);
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

            //Check balances and nonces
            for (const [address, leaf] of Object.entries(expectedNewLeafs)) {
                const newLeaf = await zkcommonjs.stateUtils.getState(address, smt, root);
                expect(newLeaf.balance.toString()).to.equal(leaf.balance);
                expect(newLeaf.nonce.toString()).to.equal(leaf.nonce);
            }

            console.log("\n");

            // Save outuput in file
            const dir = path.join(__dirname, '../inputs/');
            await fs.writeFileSync(`${dir}${inputName}${id}.json`, JSON.stringify(output, null, 2));
        }
    });

});