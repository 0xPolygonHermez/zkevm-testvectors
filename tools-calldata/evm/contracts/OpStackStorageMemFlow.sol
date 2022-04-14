// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

//TODO: CHECK
contract OpStackStorageMemFlow {
    // opcode 0x50
    function opPop() public pure {
        assembly {
            pop(0)
        }
    }
    // opcode 0x51
    function opMload() public pure {
        assembly {
            let result := mload(0)
        }
    }
    // opcode 0x52
    function opMstore() public pure {
        assembly {
            let a := 2
            mstore(0x0, a)
            return(0x0, 32)
        }
    }
    // opcode 0x53
    function opMstore8() public pure {
        assembly {
            let a := 2
            mstore8(0x0, a)
            return(0x0, 8)
        }
    }
    // opcode 0x54
    function opSload() public view {
        assembly {
            let result := sload(0)
        }
    }
    // opcode 0x55
    function opSstore() public payable {
        assembly {
            let a := 2
            sstore(0x0, a)
        }
    }

    // opcode 0x5a
    function opGas() public view {
        assembly {
            let result := gas()
            mstore(0x0, result)
        }
    }
    // // opcode 0x56
    // function opJump() public view {
    //     assembly {
    //         let label := 10
    //         jump(10)
    //     }
    // }
    // // opcode 0x57
    // function opJumpI() public view {
    //     assembly {
    //         let label := 10
    //         jumpi(10, true)
    //     }
    // }
    // // opcode 0x5b
    // function opJumpDest() public pure returns (uint256) {
    //     assembly {
    //     }
    // }
}