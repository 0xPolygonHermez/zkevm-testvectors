// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreRip7212 {
    function p256verify(bytes32 hashBytes, bytes32 r, bytes32 s, bytes32 x, bytes32 y) public {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)
            mstore(memPtr, hashBytes)
            mstore(add(memPtr, 0x20), r)
            mstore(add(memPtr, 0x40), s)
            mstore(add(memPtr, 0x60), x)
            mstore(add(memPtr, 0x80), y)

            let success := call(gas(), 0x100, 0x0, memPtr, 0xa0, memPtr, 0x20)
            result := mload(memPtr)
            sstore(0x1, result)
        }
    }
}