// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LogPadding {
    event Test0(bytes data);

    function emitEvent() public {
        bytes memory myData = hex"010203";
        bytes32 eventSignature = keccak256("Test0(bytes)");
        assembly {
            let dataPtr := add(myData, 32)
            let dataLength := mload(myData)
            log1(dataPtr, dataLength, eventSignature)
        }
    }

    function emitEventLarger(uint256 lengthLog) public {
        bytes memory myData = hex"0102030405060708090A0B0C0D0E0F0102030405060708090A0B0C0D0E0F0102030405060708090A0B0C0D0E0F0102030405060708090A0B0C0D0E0F";
        bytes32 eventSignature = keccak256("Test1(bytes)");
        assembly {
            let dataPtr := add(myData, 32)
            let dataLength := mload(myData)
            log1(dataPtr, lengthLog, eventSignature)
        }
    }
}