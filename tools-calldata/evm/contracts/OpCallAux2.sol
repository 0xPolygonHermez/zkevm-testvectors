// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpCallAux2 {

    uint256 auxVal = 1;
    address auxAddr = address(0);

     function opDelegateCallSelfBalance() external payable returns(uint256) {
        auxVal = address(this).balance;
        auxAddr = msg.sender;
    }
}