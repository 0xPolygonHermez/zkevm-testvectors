// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpArithFinal {

    uint256 res = 1;

    // opcode 0x00
    function opStop() public pure {
        assembly {
            stop()
        }
    }

    // opcode 0x01
    function opAdd() public {
        assembly {
            let tmp := add(1, 2)
            sstore(0x0, tmp)
        }
    }

    // opcode 0x02
    function opMul() public {
        assembly {
            let tmp := mul(3, 4)
            sstore(0x0, tmp)
        }
    }

    // opcode 0x03
    function opSub() public {
        assembly {
            let tmp := sub(6, 5)
            sstore(0x0, tmp)
        }
    }

    // opcode 0x04
    function opDiv() public {
        assembly {
            let tmp := div(10, 2)
            sstore(0x0, tmp)
        }
    }
}