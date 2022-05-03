// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpSHA3 {
    bytes32 hashResult;

    function sha3_0() public payable {
        hashResult = keccak256(
            abi.encodePacked(
                uint256(0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF)
            )
        );
    }

    function sha3_1() public payable {
        hashResult = keccak256(
            abi.encodePacked(
                bytes1(0x01),
                bytes2(0x0001),
                uint24(246),
                uint256(0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB),
                address(0x9345695487604058934569548760405893456954)
            )
        );
    }
}
