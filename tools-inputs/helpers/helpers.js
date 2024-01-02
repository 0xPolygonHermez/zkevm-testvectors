/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { Transaction } = require('@ethereumjs/tx');
const { Address } = require('ethereumjs-util');
const { Scalar } = require('ffjavascript');
const { processorUtils } = require('@0xpolygonhermez/zkevm-commonjs');
const { defaultAbiCoder } = require('@ethersproject/abi');
const { VirtualCountersManager } = require('@0xpolygonhermez/zkevm-commonjs');
const path = require('path');

const pathTestVectors = path.join(__dirname, '../..');

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
        gasLimit: 100000000000, // We assume that 10M gas is enough for deploy
        gasPrice: 1,
        data: deploymentBytecode,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    };
    if (Object.keys(paramsDeploy).length > 0) {
        const params = defaultAbiCoder.encode(paramsDeploy.types, paramsDeploy.values);
        txData.data = deploymentBytecode + params.slice(2);
    }
    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey);

    const deploymentResult = await vm.runTx({ tx, vcm: new VirtualCountersManager() });

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

function addRawTxChangeL2Block(batch, output, extraData, tx = undefined) {
    let dataChangeL2Block;
    if (tx) {
        dataChangeL2Block = tx;
    } else {
        dataChangeL2Block = {
            type: 11,
            deltaTimestamp: '1000',
            l1Info: {
                globalExitRoot: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
                blockHash: '0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb',
                timestamp: '42',
            },
            indexL1InfoTree: 1,
        };
    }
    const rawChangeL2BlockTx = processorUtils.serializeChangeL2Block(dataChangeL2Block);
    // Append l1Info to l1Info object
    extraData.l1Info[dataChangeL2Block.indexL1InfoTree] = dataChangeL2Block.l1Info;
    const customRawChangeL2Tx = `0x${rawChangeL2BlockTx}`;
    batch.addRawTx(customRawChangeL2Tx);
    return customRawChangeL2Tx;
}

module.exports = {
    deployContract,
    stringToHex32,
    getAccountNonce,
    updateMessageToHash,
    addRawTxChangeL2Block,
    pathTestVectors,
};
