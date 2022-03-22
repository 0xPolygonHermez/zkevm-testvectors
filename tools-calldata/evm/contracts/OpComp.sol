// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpComp {

    uint256 public ret;

    // opcode 0x10
    function opLt1() public {
        assembly {
            let result := lt(2,8)
            sstore(0x0, result)
        }
    }

    function opLt0() public {
        assembly {
            let result := lt(8,2)
            sstore(0x0, result)
        }
    }

    // opcode 0x11
    function opGt1() public {
        assembly {
            let result := gt(8,2)
            sstore(0x0, result)
        }
    }

    function opGt0() public {
        assembly {
            let result := gt(2,8)
            sstore(0x0, result)
        }
    }
    // opcode 0x12
    function opSLt1() public {
        assembly {
            let result := slt(0xc,0xe)
            sstore(0x0, result)
        }
    }

    function opSLt0() public {
        assembly {
            let result := slt(0xe,0xc)
            sstore(0x0, result)
        }
    }
    // opcode 0x13
    function opSGt1() public {
        assembly {
            let result := sgt(0xe,0xc)
            sstore(0x0, result)
        }
    }

    function opSGt0() public {
        assembly {
            let result := sgt(0xc,0xe)
            sstore(0x0, result)
        }
    }

    // opcode 0x14
    function opEq1() public {
        assembly {
            let result := eq(8,8)
            sstore(0x0, result)
        }
    }

    function opEq0() public {
        assembly {
            let result := eq(2,8)
            sstore(0x0, result)
        }
    }

    // opcode 0x15
    function opIsZero1() public {
        assembly {
            let result := iszero(0)
            sstore(0x0, result)
        }
    }

    function opIsZero0() public {
        assembly {
            let result := iszero(5)
            sstore(0x0, result)
        }
    }
}