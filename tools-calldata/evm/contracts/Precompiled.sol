// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Precompiled {
    bytes32 hashResult;
    address retEcrecover;
    bytes dataResult;

    function preSha256_0() public payable {
        hashResult = sha256(abi.encodePacked(uint16(0x1234)));
    }

    function preSha256_1() public payable {
        hashResult = sha256(
            abi.encodePacked(
                uint256(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA),
                uint256(0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB)
            )
        );
    }

    function ripemd160_0() public {
        hashResult = ripemd160(
            abi.encodePacked(
                address(0xc730B028dA66EBB14f20e67c68DD809FBC49890D),
                uint64(100)
            )
        );
    }

    function preEcrecover_0() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 28;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    function preEcrecover_1() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 5;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    function identity_0(bytes memory data) public {
        bytes memory ret = new bytes(data.length);
        assembly {
            let len := mload(data)
            if iszero(call(gas(), 0x04, 0, add(data, 0x20), len, add(ret,0x20), len)) {
                invalid()
            }
        }
        dataResult = ret;
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
                revert(0x0, 0x0)
            } default {
                result := mload(memPtr)
                sstore(0x1,result)
            }
        }
    }

    function ecAdd_0(bytes32 ax, bytes32 ay, bytes32 bx, bytes32 by) public returns (bytes32[2] memory result) {
        bytes32[4] memory input;
        input[0] = ax;
        input[1] = ay;
        input[2] = bx;
        input[3] = by;
        assembly {
            let success := call(gas(), 0x06, 0, input, 0x80, result, 0x40)
            switch success
            case 0 {
                revert(0,0)
            }
            let result1 := mload(0x80)
            let result2 := mload(0xa0)
            sstore(0x0, result1)
            sstore(0x1, result2)
        }
        return result;
    }

    function ecMul_0(bytes32 x, bytes32 y, bytes32 scalar) public returns (bytes32[2] memory result) {
        bytes32[3] memory input;
        input[0] = x;
        input[1] = y;
        input[2] = scalar;
        assembly {
            let success := call(gas(), 0x07, 0, input, 0x60, result, 0x40)
            switch success
            case 0 {
                revert(0,0)
            }
            let result1 := mload(0x80)
            let result2 := mload(0xa0)
            sstore(0x0, result1)
            sstore(0x1, result2)
        }
        return result;
    }

    function ecPairing_0(bytes memory input) public returns (bytes32 result) {
        // input is a serialized bytes stream of (a1, b1, a2, b2, ..., ak, bk) from (G_1 x G_2)^k
        uint256 len = input.length;
        require(len % 192 == 0);
        assembly {
            let memPtr := mload(0x40)
            let success := call(gas(), 0x08, 0, add(input, 0x20), len, memPtr, 0x20)
            switch success
            case 0 {
                revert(0,0)
            } default {
                result := mload(memPtr)
            }
            sstore(0x0, success)
        }
    }
}