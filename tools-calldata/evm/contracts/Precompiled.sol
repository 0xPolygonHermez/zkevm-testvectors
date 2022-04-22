// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Precompiled {
    bytes32 hashResult;

    function preSha256() public payable {
        hashResult = sha256(abi.encodePacked(uint16(0x1234)));
    }
}