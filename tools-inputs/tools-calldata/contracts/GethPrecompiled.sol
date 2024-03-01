// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract GethPrecompiled {
    uint256 dataRes;
    uint256 retDataSize;
    bytes32[32] arrayStorage;

    // https://github.com/ethereum/go-ethereum/blob/master/core/vm/testdata/precompiles/bn256Pairing.json
    function ecPairingGeneric(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x08, add(input, 32), mload(input), output, 0x40)
            sstore(0x00, success)
        }

        assembly {
            let result := returndatasize()
            sstore(0x01, result)
        }

        for (uint i = 0; i < 32; i++) {
            arrayStorage[i] = output[i];
        }
    }

    // https://github.com/ethereum/go-ethereum/blob/master/core/vm/testdata/precompiles/bn256Add.json
    function ecAdd(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x06, add(input, 32), mload(input), output, 0x80)
            sstore(0x00, success)
        }

        assembly {
            let result := returndatasize()
            sstore(0x01, result)
        }

        for (uint i = 0; i < 32; i++) {
            arrayStorage[i] = output[i];
        }
    }

    // https://github.com/ethereum/go-ethereum/blob/master/core/vm/testdata/precompiles/bn256ScalarMul.json
    function ecMul(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x07, add(input, 32), mload(input), output, 0x80)
            sstore(0x00, success)
        }

        assembly {
            let result := returndatasize()
            sstore(0x01, result)
        }

        for (uint i = 0; i < 32; i++) {
            arrayStorage[i] = output[i];
        }
    }

    // https://github.com/ethereum/go-ethereum/blob/master/core/vm/testdata/precompiles/ecRecover.json
    function ecRecover(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x01, add(input, 32), mload(input), output, 0x80)
            sstore(0x00, success)
        }

        assembly {
            let result := returndatasize()
            sstore(0x01, result)
        }

        for (uint i = 0; i < 32; i++) {
            arrayStorage[i] = output[i];
        }
    }
}