// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpCallAux2 {

    uint256 auxVal = 1;
    address auxAddr = address(0);

    function opDelegateCallSelfBalance() external payable returns(uint256) {
        auxVal = address(this).balance;
        auxAddr = msg.sender;
        assembly {
            let val := address()
            sstore(0x3, val)
            let val2 := codesize()
            sstore(0x4, val2)
            let val3 := msize()
            codecopy(val3, 0x0, val2)
            let val4 := mload(val3)
            sstore(0x5, val3)
        }
    }
}