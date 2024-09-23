// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

contract RevertConstructor {
    constructor () {
        revert("Today is not juernes");
    }
}