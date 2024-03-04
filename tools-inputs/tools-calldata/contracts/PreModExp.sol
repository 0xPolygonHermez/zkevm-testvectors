// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreModExp {
    bytes32 hashResult;
    address retEcrecover;
    bytes dataResult;
    uint256 dataRes;

    uint retDataSize;

    bytes32[32] arrayStorage;



    function modExpGeneric(bytes memory input) public {
        bytes32[32] memory output;

        assembly {
            let success := staticcall(gas(), 0x05, add(input, 32), mload(input), output, 0x140)
            sstore(0x00, success)
        }

        assembly {
            let result := returndatasize()
            sstore(0x0, result)
        }

        for (uint i = 0; i < 32; i++) {
            arrayStorage[i] = output[i];
        }
    }

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
    function modexp_3() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x40)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x22)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0x80), 0x1000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0xa0), 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0xc0), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0xe0), 0x0009000000000000000000000000000000000000000000000000000000000000)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0x100, add(memPtr, 0x100), 0x22)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(add(memPtr, 0x100))
                sstore(0x0, result)
                result := mload(add(memPtr, 0x120))
                sstore(0x1, result)
                sstore(0x3, 1)
            }
        }
    }
    function modexp_4() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x40)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x22)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0x80), 0x0000000000000000000000000000000000000000000000000000000000000111)
            mstore(add(memPtr, 0xa0), 0x0000000000000000000000000000000000000000000000000000000000001000)
            mstore(add(memPtr, 0xc0), 0x00000000000000000000000000000000000000000000000000000000000000ff)
            mstore(add(memPtr, 0xe0), 0xffff000000000000000000000000000000000000000000000000000000000000)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0x100, add(memPtr, 0x100), 0x22)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(add(memPtr, 0x100))
                sstore(0x0, result)
                result := mload(add(memPtr, 0x120))
                sstore(0x1, result)
                sstore(0x3, 1)
            }
        }
    }
    function modexp_fail(bytes32 baseSize, bytes32 exponentSize, bytes32 modulusSize ,bytes32 base, bytes32 exponent, bytes32 modulus) public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, baseSize) // base size of 1025 bytes, more than allowed from rom
            mstore(add(memPtr, 0x20), exponentSize)
            mstore(add(memPtr, 0x40), modulusSize)

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
    function modexp_ReturnCheck() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x80)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x80)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), 0x00000000000000000000000000000000000000000000000000004339f6e1061a)
            mstore(add(memPtr, 0x80), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0xa0), 0x00000000000000000000000000000000000000000000000000000000002b32af)
            mstore(add(memPtr, 0xc0), 0x0000000000000000000000000000000000000000000000000000000000000064)
            mstore(add(memPtr, 0xe0), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            mstore(add(memPtr, 0x100), 0x000000000000000000000000000000000000000000000000000000056101669d)
            mstore(add(memPtr, 0x120), 0x00000000000000000000000000000000000000000000000000000001eb07e0ea)
            mstore(add(memPtr, 0x140), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0x160), 0x0000000000000000000000000000000000000000000000000000000000000000)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0x180, memPtr, 0x80)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1, result)
                result := mload(add(memPtr, 0x20))
                sstore(0x2, result)
                result := mload(add(memPtr, 0x40))
                sstore(0x3, result)
                result := mload(add(memPtr, 0x60))
                sstore(0x4, result)
            }
            returndatacopy(200,0,128)
            result := mload(200)
            sstore(0x5, result)
            result := mload(add(200, 0x20))
            sstore(0x6, result)
            result := mload(add(200, 0x40))
            sstore(0x7, result)
            result := mload(add(200, 0x60))
            sstore(0x8, result)
        }
    }
}