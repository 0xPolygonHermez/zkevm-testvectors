// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreRipemd160 {
    bytes32 hashResult;
    address retEcrecover;
    bytes dataResult;

    function ripemd160_0() public {
        hashResult = ripemd160(
            abi.encodePacked(
                address(0xc730B028dA66EBB14f20e67c68DD809FBC49890D),
                uint64(100)
            )
        );
    }
}