// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract LoopEcrecover {

    function loop(uint numLoops) public {
        for (uint i = 0; i < numLoops; i++) {
            assembly {
                // free memory pointer
                let memPtr := mload(0x40)

                mstore(memPtr, 0x0000000000000000000000000000003ebaaedce6af48a03bbfd25e8cd0364142)
                mstore(add(memPtr, 0x20), 0x000000000000000000000000000000000000000000000000000000000000001c)
                mstore(add(memPtr, 0x40), 0x0000000000000000000000000000000000000000000000000000000000000001)
                mstore(add(memPtr, 0x60), 0xffffffffffffffffffffffffffffffbfffffffffffffffffffffffffffffffff)

                let success := call(gas(), 0x01, 0x0, memPtr, 0x80, memPtr, 0x20)
                sstore(0x00, success)
            }
        }
    }

    function loop2(uint numLoops) public {
        bytes32 messHash = 0x0000000000000000000000000000003ebaaedce6af48a03bbfd25e8cd0364142;
        uint8 v = 27;
        bytes32 r = 0x0000000000000000000000000000000000000000000000000000000000000001;
        bytes32 s = 0xffffffffffffffffffffffffffffffbfffffffffffffffffffffffffffffffff;

        for (uint i = 0; i < numLoops; i++) {
            address retEcrecover = ecrecover(messHash, v, r, s);
        }
    }
}