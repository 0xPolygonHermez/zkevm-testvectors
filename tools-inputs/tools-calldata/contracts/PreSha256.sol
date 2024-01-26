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

    function preSha256_ReturnCheck() public payable {
        bytes memory result;
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)
            mstore(add(memPtr, 0x20), 0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB)

            let success := call(gas(), 0x02, 0x0, memPtr, 0x40, memPtr, 0x20)
            switch success
            case 0 {
                sstore(0x3, 2)
            } default {
                result := mload(memPtr)
                sstore(0x1, result)
                returndatacopy(200,0,32)
                result := mload(200)
                sstore(0x2, result)
            }
        }
    }

}