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
            mstore(memPtr, 0x20)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x27)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x7)
            mstore(add(memPtr, 0x80), 0x8)
            mstore(add(memPtr, 0xa0), 0x0)
            mstore8(add(memPtr, 0xc0), 0x0)
            mstore8(add(memPtr, 0xc1), 0x0)
            mstore8(add(memPtr, 0xc2), 0x0)
            mstore8(add(memPtr, 0xc3), 0x0)
            mstore8(add(memPtr, 0xc4), 0x0)
            mstore8(add(memPtr, 0xc5), 0x0)
            mstore8(add(memPtr, 0xc6), 0x09)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xc7, memPtr, 0x27)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
                result := mload(add(memPtr,0x20))
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
            mstore(memPtr, 0x20)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x27)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x7)
            mstore(add(memPtr, 0x80), 0x6e)
            mstore(add(memPtr, 0xa0), 0x1111111111111111111111111111111111111111111111111111)
            mstore8(add(memPtr, 0xc0), 0x11)
            mstore8(add(memPtr, 0xc1), 0x11)
            mstore8(add(memPtr, 0xc2), 0x11)
            mstore8(add(memPtr, 0xc3), 0x11)
            mstore8(add(memPtr, 0xc4), 0x11)
            mstore8(add(memPtr, 0xc5), 0x11)
            mstore8(add(memPtr, 0xc6), 0x11)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xc7, memPtr, 0x27)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
                result := mload(add(memPtr,0x20))
                sstore(0x2,result)
                sstore(0x3, 1)
            }
        }
    }

    function modexp_3() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x20)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x41)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x124f8)
            mstore(add(memPtr, 0x80), 0x21)
            mstore(add(memPtr, 0xa0), 0x1111111111111111111111111111111111111111111111111111111111111111)
            mstore(add(memPtr, 0xc0), 0x1111111111111111111111111111111111111111111111111111111111111111)
            mstore8(add(memPtr, 0xe0), 0x11)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xe1, memPtr, 0x41)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
                result := mload(add(memPtr,0x20))
                sstore(0x2,result)
                result := mload(add(memPtr,0x40))
                sstore(0x3,result)
            }
        }
    }

    function modexp_4() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x20)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x40)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x124f8)
            mstore(add(memPtr, 0x80), 0x21)
            mstore(add(memPtr, 0xa0), 0x1111111111111111111111111111111111111111111111111111111111111111)
            mstore(add(memPtr, 0xc0), 0x1111111111111111111111111111111111111111111111111111111111111111)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xe0, memPtr, 0x40)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
                result := mload(add(memPtr,0x20))
                sstore(0x2,result)
                result := mload(add(memPtr,0x40))
                sstore(0x3,result)
            }
        }
    }
}