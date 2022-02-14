const { readFileSync } = require("fs");
const solc = require('solc');
const { Address, Account, BN } = require('ethereumjs-util');
const { Transaction, TxData } = require('@ethereumjs/tx');

function getSolcInput() {
    const contentTest = readFileSync('contracts/Test.sol', 'utf8');
    const contentToken = readFileSync('contracts/Token.sol', 'utf8');
    return {
        language: 'Solidity',
        sources: {
            'contracts/Test.sol': {
                content: contentTest,
            },
            'contracts/Token.sol': {
                content: contentToken,
            }
            // If more contracts were to be compiled, they should have their own entries here
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: 'petersburg',
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    };
}

/**
 * This function compiles all the contracts in `contracts/` and returns the Solidity Standard JSON
 * output. If the compilation fails, it returns `undefined`.
 *
 * To learn about the output format, go to https://solidity.readthedocs.io/en/v0.5.10/using-the-compiler.html#compiler-input-and-output-json-description
 */
 function compileContracts() {
    const input = getSolcInput();
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    let compilationFailed = false;

    if (output.errors) {
        for (const error of output.errors) {
            if (error.severity === 'error') {
                console.error(error.formattedMessage);
                compilationFailed = true;
            } else {
                console.warn(error.formattedMessage);
            }
        }
    }

    if (compilationFailed) {
        return undefined;
    }

    return output;
}

function getTokenDeploymentBytecode(solcOutput, contract) {
    console.log(solcOutput.contracts);
    return solcOutput.contracts[`contracts/${contract}`].Test.evm.bytecode.object;
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
    }

    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey);

    const deploymentResult = await vm.runTx({ tx });

    if (deploymentResult.execResult.exceptionError) {
        throw deploymentResult.execResult.exceptionError
    }

    return deploymentResult.createdAddress
}


async function getAccountNonce(vm, accountPrivateKey) {
    const address = Address.fromPrivateKey(accountPrivateKey)
    const account = await vm.stateManager.getAccount(address)
    return account.nonce
}


async function mint(
    vm,
    senderPrivateKey,
    contractAddress,
    amount,
    address
) {
    const params = defaultAbiCoder.encode(['address', 'uint256'], [address, amount])
    const sigHash = new Interface(['function mint(address, uint256)']).getSighash('mint')
    const txData = {
        to: contractAddress,
        value: 0,
        gasLimit: 2000000, // We assume that 2M is enough,
        gasPrice: 1,
        data: sigHash + params.slice(2),
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(txData).sign(senderPrivateKey)
    const setMintResult = await vm.runTx({ tx })

    if (setMintResult.execResult.exceptionError) {
        throw setMintResult.execResult.exceptionError
    }
}

async function getTotalSupply(vm, contractAddress, caller) {
    const sigHash = new Interface(['function totalSupply()']).getSighash('totalSupply')
    const symbolResult = await vm.runCall({
        to: contractAddress,
        caller: caller,
        origin: caller, // The tx.origin is also the caller here
        data: Buffer.from(sigHash.slice(2), 'hex'),
    })

    if (symbolResult.execResult.exceptionError) {
        throw symbolResult.execResult.exceptionError
    }

    const results = defaultAbiCoder.decode(['uint256'], symbolResult.execResult.returnValue)

    return results[0]
}

async function getSymbol(vm, contractAddress, caller) {
    const sigHash = new Interface(['function symbol()']).getSighash('symbol')
    const symbolResult = await vm.runCall({
        to: contractAddress,
        caller: caller,
        origin: caller, // The tx.origin is also the caller here
        data: Buffer.from(sigHash.slice(2), 'hex'),
    })

    if (symbolResult.execResult.exceptionError) {
        throw symbolResult.execResult.exceptionError
    }

    const results = defaultAbiCoder.decode(['string'], symbolResult.execResult.returnValue)

    return results[0]
}

module.exports = {
    getSolcInput,
    compileContracts,
    getTokenDeploymentBytecode,
    getAccountNonce,
    deployContract,
    mint,
    getTotalSupply,
    getSymbol
};