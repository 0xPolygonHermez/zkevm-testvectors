
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Test3 {

    function opAddTest() public pure returns (uint256){
        assembly{
            let c := add(1,2)
            mstore(0x0, c)
            return(0x0, 32)
        }
    }
}