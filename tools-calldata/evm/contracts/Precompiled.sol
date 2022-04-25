// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Precompiled {
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

    function ripemd160_0() public {
        hashResult = ripemd160(
            abi.encodePacked(
                address(0xc730B028dA66EBB14f20e67c68DD809FBC49890D),
                uint64(100)
            )
        );
    }
}