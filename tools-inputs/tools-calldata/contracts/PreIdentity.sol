// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreIdentity {
    bytes dataResult;

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

    function identity_1(bytes memory data) public {
        bytes memory ret = new bytes(data.length);
        assembly {
            let len := mload(data)
            let res := call(gas(), 0x04, 0, add(data, 0x20), len, add(ret,0x20), len)
            sstore(0x5, res)
        }
        dataResult = ret;
    }

    function identity_ReturnCheck() public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // set data
            mstore(memPtr, 0x1234567891234567891234567891234567891234567891234567891234567891)
            mstore(add(memPtr, 0x20), 0x2345678912345678910000000000000000000000000000000000000000000000)
            sstore(0x1, 1)

            let len := 41
            let res := call(gas(), 0x04, 0, memPtr, 0x29, add(memPtr,0x60), 0x29)
            result := mload(add(memPtr,0x60))
            sstore(0x2, result)
            result := mload(add(memPtr,0x80))
            sstore(0x3, result)
            returndatacopy(200,0,0x29)
            result := mload(200)
            sstore(0x4, result)
            result := mload(add(200, 0x20))
            sstore(0x5, result)
        }
    }
}