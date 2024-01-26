// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreEc {

    bytes32 res0;
    bytes32 res1;

    function Fadd(bytes32 ax, bytes32 ay, bytes32 bx, bytes32 by) public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(ax, ay, bx, by);

        assembly {
            let resultCall := call(gas(), 0x06, 0, add(args, 32), 0x80, output, 0x40)
            sstore(0x2, resultCall)
        }

        return output;
    }

    function Fadd_fail(bytes32 ax, bytes32 ay, bytes32 bx, bytes32 by) public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(ax, ay, bx, by);

        assembly {
            let resultCall := call(10000, 0x06, 0, add(args, 32), 0x7f, output, 0x40)
            sstore(0x0, resultCall)
        }

        return output;
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

    function ecAdd_1() public {
        bytes32 ax = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 ay = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32 bx = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 by = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32[2] memory res = Fadd_fail(ax, ay, bx, by);
        res0 = res[0];
        res1 = res[1];
    }

    function ecAdd_ReturnCheck() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000002)
            mstore(add(memPtr, 0x40), 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0x60), 0x0000000000000000000000000000000000000000000000000000000000000002)
            mstore(add(memPtr, 0x80), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            mstore(add(memPtr, 0xa0), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)

            let success := call(gas(), 0x06, 0x0, memPtr, 0x80, add(memPtr,0x60), 0x60)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(add(memPtr,0x60))
                sstore(0x1, result)
                result := mload(add(memPtr,0x80))
                sstore(0x2, result)
                result := mload(add(memPtr,0xa0))
                sstore(0x3, result)
                returndatacopy(200,0,64)
                result := mload(200)
                sstore(0x4, result)
                result := mload(add(200,0x20))
                sstore(0x5, result)
            }
        }
    }

    function Fmul(bytes32 x, bytes32 y, bytes32 scalar) public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(x, y, scalar);

        assembly {
            let resultCall := call(gas(), 0x07, 0, add(args, 32), 0x60, output, 0x40)
            sstore(0x2, resultCall)
        }

        return output;
    }

    function Fmul_fail(bytes32 x, bytes32 y, bytes32 scalar) public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(x, y, scalar);

        assembly {
            let resultCall := call(5000, 0x07, 0, add(args, 32), 0x5f, output, 0x40)
            sstore(0x2, resultCall)
        }

        return output;
    }

    function ecMul_0() public {
        bytes32 x = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 y = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32 scalar = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32[2] memory res = Fmul(x, y, scalar);
        res0 = res[0];
        res1 = res[1];
    }

    function ecMul_1() public {
        bytes32 x = hex"0000000000000000000000000000000000000000000000000000000000000001";
        bytes32 y = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32 scalar = hex"0000000000000000000000000000000000000000000000000000000000000002";
        bytes32[2] memory res = Fmul_fail(x, y, scalar);
        res0 = res[0];
        res1 = res[1];
    }

    function ecMul_ReturnCheck() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x0000000000000000000000000000000000000000000000000000000000000001)
            mstore(add(memPtr, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000002)
            mstore(add(memPtr, 0x40), 0x0000000000000000000000000000000000000000000000000000000000000002)

            let success := call(gas(), 0x07, 0x0, memPtr, 0x60, memPtr, 0x40)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1, result)
                result := mload(add(memPtr,0x20))
                sstore(0x2, result)
                returndatacopy(200,0,64)
                result := mload(200)
                sstore(0x3, result)
                result := mload(add(200,0x20))
                sstore(0x4, result)
            }
        }
    }

    function Fpairing(bytes32 x1, bytes32 y1, bytes32 x2, bytes32 y2, bytes32 x3, bytes32 y3) public  {
        bytes memory args = abi.encodePacked(x1, y1, x2, y2, x3, y3);

        assembly {
            let memPtr := mload(0x40)
            let resultCall := call(gas(), 0x08, 0, add(args, 0x20), 192, memPtr, 0x20)
            sstore(0x0, resultCall)
        }
    }

    function Fpairing_fail(bytes32 x1, bytes32 y1, bytes32 x2, bytes32 y2, bytes32 x3, bytes32 y3) public {
        bytes memory args = abi.encodePacked(x1, y1, x2, y2, x3, y3);

        assembly {
            let memPtr := mload(0x40)
            let resultCall := call(10000, 0x08, 0, add(args, 0x20), 191, memPtr, 0x20)
            sstore(0x0, resultCall)
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

    function ecPairing_1() public {
        bytes32 x1 = hex"0000000000000000000000000000000000000000000000000000000000000000";
        bytes32 y1 = hex"0000000000000000000000000000000000000000000000000000000000000000";
        bytes32 x2 = hex"198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2";
        bytes32 y2 = hex"1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed";
        bytes32 x3 = hex"090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b";
        bytes32 y3 = hex"12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa";

        Fpairing_fail(x1, y1, x2, y2, x3, y3);
    }

    function ecPairing_ReturnCheck() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 0x40), 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2)
            mstore(add(memPtr, 0x60), 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed)
            mstore(add(memPtr, 0x80), 0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b)
            mstore(add(memPtr, 0xa0), 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa)

            let success := call(gas(), 0x08, 0x0, memPtr, 0xc0, memPtr, 0x20)
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