// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreP256Verify {

    function preP256Verify(bytes32 msgHash, bytes32 r, bytes32 s, bytes32 x, bytes32 y) public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, msgHash) // msg hash
            mstore(add(memPtr, 0x20), r) // r
            mstore(add(memPtr, 0x40), s) // s
            mstore(add(memPtr, 0x60), x) // pubKeyX
            mstore(add(memPtr, 0x80), y) // pubKeyY

            let success := call(gas(), 0x100, 0x0, memPtr, 0xa0, memPtr, 0x20)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1, result)
                returndatacopy(200,0,32)
                result := mload(200)
                sstore(0x2, result)
            }
        }
    }
}