// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpInvalid {
   
    // opcode 0xfe
    function opInvalid() public pure {
        assembly{
            invalid()
        }
    }
}