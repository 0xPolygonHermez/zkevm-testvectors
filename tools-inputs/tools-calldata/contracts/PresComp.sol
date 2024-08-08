// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PresComp {
    bytes32 hashResult;
    address retEcrecover;
    bytes32 res0;
    bytes32 res1;
    bytes32 res2;
    bytes32 res3;

    function preSha256_0() public payable {
        hashResult = sha256(abi.encodePacked(uint16(0x1234)));
    }

    function preEcrecover_0() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 28;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    function ecAdd_0() public {
        bytes32 ax = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 ay = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32 bx = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 by = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32[2] memory res = Fadd(ax, ay, bx, by);
        res0 = res[0];
        res1 = res[1];
    }

    function ecMul_0() public {
        bytes32 x = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 y = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32 scalar = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32[2] memory res = Fmul(x, y, scalar);
        res2 = res[0];
        res3 = res[1];
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
                sstore(0x6,result)
                sstore(0x7, 1)
            }
        }
    }

    

    function Fadd(bytes32 ax, bytes32 ay, bytes32 bx, bytes32 by) public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(ax, ay, bx, by);

        assembly {
            let resultCall := call(gas(), 0x06, 0, add(args, 32), 0x80, output, 0x40)
            sstore(0x8, resultCall)
        }

        return output;
    }

    function Fmul(bytes32 x, bytes32 y, bytes32 scalar) public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(x, y, scalar);

        assembly {
            let resultCall := call(gas(), 0x07, 0, add(args, 32), 0x60, output, 0x40)
            sstore(0x9, resultCall)
        }

        return output;
    }


    function Fpairing(bytes32 x1, bytes32 y1, bytes32 x2, bytes32 y2, bytes32 x3, bytes32 y3) public  {
        bytes memory args = abi.encodePacked(x1, y1, x2, y2, x3, y3);

        assembly {
            let memPtr := mload(0x40)
            let resultCall := call(gas(), 0x08, 0, add(args, 0x20), 192, memPtr, 0x20)
            sstore(0xa, resultCall)
        }
    }

    function ecPairing_0() public {
        bytes32 x1 = hex"0000000000000000000000000000000000000000000000000000000000000000";
        bytes32 y1 = hex"0000000000000000000000000000000000000000000000000000000000000000";
        bytes32 x2 = hex"198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2";
        bytes32 y2 = hex"1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed";
        bytes32 x3 = hex"090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b";
        bytes32 y3 = hex"12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa";

        Fpairing(x1, y1, x2, y2, x3, y3);
    }
    

}