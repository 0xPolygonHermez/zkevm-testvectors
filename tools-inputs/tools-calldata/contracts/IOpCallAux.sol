// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IOpCallAux {
    function auxReturn() external returns (uint256);
    function auxUpdate() external returns (uint256);
    function auxUpdateValues() external payable returns(uint256);
    function auxFail() external;
    function auxStop() external;
}