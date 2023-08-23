// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Test4 {

    uint256 public stoFirst = 1;
    uint256 public stoSecond = 2;

    constructor(uint256 stoFirstNew) {
        stoFirst = stoFirstNew;
    }
}