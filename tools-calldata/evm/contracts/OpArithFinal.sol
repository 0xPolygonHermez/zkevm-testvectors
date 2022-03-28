// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpArithFinal {

    uint256 res = 1;

    // opcode 0x01
    function opAdd() public {
        assembly {
            let tmpAdd := add(1, 2)
            sstore(0x0, tmpAdd)
        }
    }
}