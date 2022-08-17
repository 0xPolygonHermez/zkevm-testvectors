/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { Transaction } = require('@ethereumjs/tx');
const { Address } = require('ethereumjs-util');
const { Scalar } = require('ffjavascript');
const { defaultAbiCoder } = require('@ethersproject/abi');

async function getAccountNonce(vm, accountPrivateKey) {
    const address = Address.fromPrivateKey(accountPrivateKey);
    const account = await vm.stateManager.getAccount(address);
    return account.nonce;
}

async function deployContract(
    vm,
    senderPrivateKey,
    deploymentBytecode,
    paramsDeploy,
) {
    // Contracts are deployed by sending their deployment bytecode to the address 0
    // The contract params should be abi-encoded and appended to the deployment bytecode.
    const txData = {
        value: 0,
        gasLimit: 10000000, // We assume that 10M gas is enough for deploy
        gasPrice: 1,
        data: deploymentBytecode,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    };

    if (Object.keys(paramsDeploy).length > 0) {
        const params = defaultAbiCoder.encode(paramsDeploy.types, paramsDeploy.values);
        txData.data = deploymentBytecode + params.slice(2);
    }

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
