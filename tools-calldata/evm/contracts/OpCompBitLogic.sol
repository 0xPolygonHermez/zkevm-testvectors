// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpCompBitLogic {
    // opcode 0x10
    function opLt() public pure {
        assembly {
            let result := lt(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x11
    function opGt() public pure {
        assembly {
            let result := gt(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x12
    function opSLt() public pure {
        assembly {
            let result := slt(8,2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x13
    function opSGt() public pure {
        assembly {
            let result := sgt(8,2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x14
    function opEq() public pure {
        assembly {
            let result := eq(8,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x15
    function opIsZero() public pure {
        assembly {
            let result := iszero(0)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x16
    function opAnd() public pure {
        assembly {
            let result := and(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x17
    function opOr() public pure {
        assembly {
            let result := or(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x18
    function opXor() public pure {
        assembly {
            let result := xor(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x19
    function opNot() public pure {
        assembly {
            let result := not(2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x1a
    function opByte() public pure {
        assembly {
            let result := byte(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x1b
    function opShl() public pure {
        assembly {
            let result := shl(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x1c
    function opShr() public pure {
        assembly {
            let result := shr(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x1d
    function opSar() public pure {
        assembly {
            let result := sar(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
}