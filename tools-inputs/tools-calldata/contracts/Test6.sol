// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Test6 {

    constructor() payable {}

    uint256 public auxBalance = 0;

    function checkMsgValue() public payable {
        auxBalance = address(this).balance;
    }
}