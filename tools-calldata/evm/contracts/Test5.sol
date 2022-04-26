// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Test5 {

    constructor() payable {}

    uint256 public stoFirst = 1;
    uint256 public stoSecond = 2;

    mapping(uint256 => uint256) public stoMapping;

    function setFirst(uint256 _stoFirst) public {
        stoFirst = _stoFirst;
    }

    function setSecond(uint256 _stoSecond) public {
        stoSecond = _stoSecond;
    }

    function setMapping(uint256 key, uint256 value) public {
        stoMapping[key] = value;
    }
}