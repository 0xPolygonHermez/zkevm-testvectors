/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { Transaction } = require('@ethereumjs/tx');
const { Address } = require('ethereumjs-util');
const { Scalar } = require('ffjavascript');
const zkcommonjs = require('@polygon-hermez/zkevm-commonjs');

async function getAccountNonce(vm, accountPrivateKey) {
    const address = Address.fromPrivateKey(accountPrivateKey);
    const account = await vm.stateManager.getAccount(address);
    return account.nonce;
}

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
    };

    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey);

    const deploymentResult = await vm.runTx({ tx });

    if (deploymentResult.execResult.exceptionError) {
        throw deploymentResult.execResult.exceptionError;
    }

    return deploymentResult.createdAddress;
}

function stringToHex32(value, leftAppend = false) {
    const aux = Scalar.e(value).toString(16).padStart(64, '0');
    return leftAppend ? `0x${aux}` : aux;
}

function updateMessageToHash(messageToHash) {
    const returnMessageToHash = [];
    for (let k = 0; k < messageToHash.length; k++) {
        const param = messageToHash[k];
        let newParam = param;
        if (param === '0') {
            newParam = '0x';
        } else if (param.length % 2 !== 0) {
            newParam = newParam.startsWith('0x') ? `0x0${newParam.slice(2)}` : `0x0${newParam}`;
        } else {
            newParam = newParam.startsWith('0x') ? newParam : `0x${newParam}`;
        }
        returnMessageToHash.push(newParam);
    }
    return returnMessageToHash;
}

module.exports = {
    deployContract,
    stringToHex32,
    getAccountNonce,
    updateMessageToHash,
};
