// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreRip7212Random {
    function p256verifyRandom(bytes memory input) public returns (bytes memory){
        uint length = input.length;
        bytes memory result;

        assembly {
            let memPtr := mload(0x40)
            let success := call(gas(), 0x100, 0x0, 0xa0, length, memPtr, 0x20)
            result := mload(memPtr)
            sstore(0x1, result)
            sstore(0x2, 0x22)
        }
        return result;
    }
}