// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreEcrecover {
    address retEcrecover;

    // correct ecrecover
    function preEcrecover_0() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 28;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    // v out of range: v < 27
    function preEcrecover_1() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 5;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    // v out of range: v > 28
    function preEcrecover_2() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 101;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    // r out of range: r > 115792089237316195423570985008687907852837564279074904382605163141518161494337
    function preEcrecover_3() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 27;
        bytes32 r = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364144;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    // s out of range (valid): s > 57896044618658097711785492504343953926418782139537452191302581570759080747169
    function preEcrecover_4() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 27;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20af;

        retEcrecover = ecrecover(messHash, v, r, s);
    }


    // s out of range (no valid): s > 115792089237316195423570985008687907852837564279074904382605163141518161494337
    function preEcrecover_5() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 27;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364144;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    function preEcrecover_ReturnCheck() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3)
            mstore(add(memPtr, 0x20), 0x000000000000000000000000000000000000000000000000000000000000001c)
            mstore(add(memPtr, 0x40), 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608)
            mstore(add(memPtr, 0x60), 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada)

            let success := call(gas(), 0x01, 0x0, memPtr, 0x80, memPtr, 0x20)
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