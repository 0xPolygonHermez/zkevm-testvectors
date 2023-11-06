// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreModExp {
    bytes32 hashResult;
    address retEcrecover;
    bytes dataResult;
    uint256 dataRes;

    function modexp_0(bytes32 base, bytes32 exponent, bytes32 modulus) public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x20)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x20)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), base)
            mstore(add(memPtr, 0x80), exponent)
            mstore(add(memPtr, 0xa0), modulus)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xc0, memPtr, 0x20)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
                sstore(0x3, 1)
            }
        }
    }
    function modexp_1() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x40)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x20)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0x80), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0xa0), 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0xc0), 0x0000000000000000000000000000000000000000000000000000000000000009)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xe0, memPtr, 0x20)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
                sstore(0x3, 1)
            }
        }
    }
    function modexp_2() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x40)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x20)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0x80), 0x1000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0xa0), 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0xc0), 0x0000000000000000000000000000000000000000000000000000000000000009)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xe0, memPtr, 0x20)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1, result)
                sstore(0x3, 1)
            }
        }
    }
}