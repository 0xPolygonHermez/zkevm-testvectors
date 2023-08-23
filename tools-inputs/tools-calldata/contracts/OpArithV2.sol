// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpArith {
    // opcode 0x0a
    function opExp() public pure {
        assembly {
            let result := exp(2,256)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
}