// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreSha256 {
    bytes32 hashResult;

    function preSha256_0() public payable {
        hashResult = sha256(abi.encodePacked(uint16(0x1234)));
    }

    function preSha256_1() public payable {
        hashResult = sha256(
            abi.encodePacked(
                uint256(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA),
                uint256(0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB)
            )
        );
    }
}