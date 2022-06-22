// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Test7 {

    uint256 immutable stoFirst;
    uint256 immutable stoSecond;

    constructor(uint256 param1, uint256 param2) {
        stoFirst = param1;
        stoSecond = param2;
    }

    function getStoFirst() public returns (uint256){
        return stoFirst;
    }

    function getStoSecond() public returns (uint256){
        return stoSecond;
    }
}
