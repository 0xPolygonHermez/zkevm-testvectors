// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract StackErrors {

    function stackOverflow() public {
        stackOverflow();
    }

    bytes32 constant auxStackOverflow = 0xddf91d0c00000000000000000000000000000000000000000000000000000000;

    function stackOverflowCall() public {
        assembly {
            mstore(0x80, auxStackOverflow)
            let success := call(div(gas(),2), address(), 0x00, 0x80, 0x04, 0x80, 0x20)
            sstore(0x1, success)
        }
    }

    function stackUnderflow() public {
        assembly{
            let a := add(3,4)
            sstore(0x0,a)
            pop(a)
            pop(a)
        }
    }
}