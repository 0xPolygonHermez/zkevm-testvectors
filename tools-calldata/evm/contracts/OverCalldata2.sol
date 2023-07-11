// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

// 2097152 --> 0x10000 * 32

contract OverCalldata2 {
   address contractAddress;

   function triggerOverCalldata() public {
      MemTest testContract = new MemTest();
      contractAddress = address(testContract);
      bytes4 selector = MemTest.callMe.selector;

      assembly {
        mstore(0, selector)
        mstore(2097120, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) // 32 // write 32 bytes to beyond 0x10000 in memory and pass it as calldata to the next CTX
        mstore(2064384, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) // 32

        // JESUS
        mstore(2097120, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
        // 2097120 --> 2097152 peak --> breaks the executor

        //2097152 - 1024 * 32
        //2064384 --> writes on memory on the next contract
        mstore(2064384, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
        // FINISH JESUS

        // 2097152 + 32 = 2097184;
        let success := call(gas(), testContract, 0, 0, 2097184, 0, 0x20)
      }
   }
}

contract MemTest {
   uint firstSlot = 1;

   function callMe() public {
      assembly {
         let res := mload(0x00) // should read 0x00
         sstore(0, res)
      }
   }
}