const { Transaction } = require('@ethereumjs/tx');
const { Address } = require('ethereumjs-util');
const Scalar = require("ffjavascript").Scalar;
const zkcommonjs = require("@polygon-hermez/zkevm-commonjs");

async function deployContract(
    vm,
    senderPrivateKey,
    deploymentBytecode,
) {
    // Contracts are deployed by sending their deployment bytecode to the address 0
    // The contract params should be abi-encoded and appended to the deployment bytecode.
    const txData = {
        value: 0,
        gasLimit: 2000000, // We assume that 2M is enough,
        gasPrice: 1,
        data: deploymentBytecode,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey);

    const deploymentResult = await vm.runTx({ tx });

    if (deploymentResult.execResult.exceptionError) {
        throw deploymentResult.execResult.exceptionError
    }

    return deploymentResult.createdAddress
}

function stringToHex32(value, leftAppend = false) {
    const aux = Scalar.e(value).toString(16).padStart(64, '0');
    return leftAppend ? `0x${aux}` : aux;
}

async function getSMT(root, db, F) {
    const smt = await _getSMT(root, db, F, {});
    //Reverse json object to have root at the top
    const arr = Object.keys(smt).map((key) => [key, smt[key]]);
    return arr.reverse().reduce((acc, curr) => {
        acc[curr[0]] = curr[1];
        return acc;
      }, {})
}

async function _getSMT(root, db, F, res = {}) {

    const sibilings = await db.getSmtNode(root);
    const value = [];
    //Reversed to have the root as the first key
    for(const  val of sibilings) {
        value.push(F.toString(val, 16).padStart(64, "0"));
        if(F.eq(sibilings[0], F.one) || F.isZero(val)) {
            continue;
        }
        await _getSMT(val, db, F, res);
    }

    res[F.toString(root, 16).padStart(64, "0")] = value;
    return res;
}

async function getAccountNonce(vm, accountPrivateKey) {
    const address = Address.fromPrivateKey(accountPrivateKey)
    const account = await vm.stateManager.getAccount(address)
    return account.nonce
}

function calculatebatchHashDataFromInput(input) {
    console.log("Old batchHashData: ", input.batchHashData);
    const batchHashData = zkcommonjs.contractUtils.calculateBatchHashData(
        input.batchL2Data,
        input.globalExitRoot,
        input.timestamp,
        input.sequencerAddr,
        input.chainId
    );
    console.log("New batchHashData: ", batchHashData);
    input.batchHashData = batchHashData;
    return input;
}

module.exports = {
    deployContract,
    stringToHex32,
    getSMT,
    getAccountNonce,
    calculatebatchHashDataFromInput
}