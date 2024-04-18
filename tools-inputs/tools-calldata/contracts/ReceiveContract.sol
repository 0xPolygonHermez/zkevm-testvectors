// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract ReceiveContract {

    uint256 public gas = 0;

    receive() external payable {
        gas = 1;
    }
}