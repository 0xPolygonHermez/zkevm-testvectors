// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract ReturnPreCompiled {
    uint256 dataRes;
    uint256 retDataSize;
    bytes32[32] arrayStorage;

    function modExpGeneric(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x05, add(input, 32), mload(input), output, 0x20)
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

    function sha256Generic(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x02, add(input, 32), mload(input), output, 0x20)
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

    function sha256GenericMore(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x02, add(input, 32), mload(input), output, 0x40)
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

    function sha256GenericLess(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x02, add(input, 32), mload(input), output, 0x10)
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

    function ecAddGeneric(bytes memory input, uint256 retSize) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x06, add(input, 32), mload(input), output, retSize)
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

    function ecMulGeneric(bytes memory input, uint256 retSize) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x07, add(input, 32), mload(input), output, retSize)
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

    function ecPairingGeneric(bytes memory input, uint256 retSize) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x08, add(input, 32), mload(input), output, retSize)
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

    function p256verifyGeneric(bytes memory input, uint256 retSize) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x100, add(input, 32), mload(input), output, retSize)
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