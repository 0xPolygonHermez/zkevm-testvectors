// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract ViewFunction {
    uint256 inStorage = 4;

    function testView(uint256 a, uint256 b) public view returns (uint256){
        uint256 tmp = 0;
        tmp = a + b + inStorage;
        return tmp;
    }
}