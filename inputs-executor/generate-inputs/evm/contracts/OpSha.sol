// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OpSha {
    // opcode 0x20
    function opKeccak256() public pure {
        assembly {
            mstore(0x0,0x1) // memory[0:32] = 0x0000000000000000000000000000000000000000000000000000000000000001
            let result := keccak256(0, 32) // keccak256(memory[0:32]) = 0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
}
