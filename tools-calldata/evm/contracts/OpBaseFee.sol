// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract opBaseFee {

    uint256 res = 1;

    // opcode 0x00
    function opBaseFeeTest() public {
         assembly {
            let tmp := basefee()
            sstore(0x0, tmp)
        }
    }
}