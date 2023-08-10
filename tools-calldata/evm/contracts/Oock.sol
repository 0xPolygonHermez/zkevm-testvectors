// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Oock {
    uint firstSlot = 5;

    function keccaks(uint256 bytesKeccak) public returns (bytes32 test){
      firstSlot = 2;

      assembly {
        test := keccak256(0, bytesKeccak)
      }

      firstSlot = 8;

      return test;
    }
}
// 1000000 --> oock