// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title GasRefund
 * @dev Store & retrieve value in a variable
 */
contract GasRefund {

    uint256 number = 10;
    uint256 number2 = 20;

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
    }

    /**
     * @dev Return value
     * @return value of 'number'
     */
    function retrieve() public view returns (uint256){
        return number;
    }

    function release() public{
        number = 0;
        number2 = 0;
    }
}