// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpArith {
    // opcode 0x00
    function opStop() public pure {
        assembly {
            stop()
        }
    }
    // opcode 0x01
    function opAdd() public pure {
        assembly {
            let result := add(1, 2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x02
    function opMul() public pure {
        assembly {
            let result := mul(2,3)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x03
    function opSub() public pure {
        assembly {
            let result := sub(3,1)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x04
    function opDiv() public pure {
        assembly {
            let result := div(10,2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x05
    function opSDiv() public pure{
        assembly {
            let result := sdiv(10,2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x06
    function opMod() public pure {
        assembly {
            let result := mod(10,3)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x07
    function opSMod() public pure {
        assembly {
            let result := smod(10,3)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x08
    function opAddMod() public pure {
        assembly {
            let result := addmod(10,5,2)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x09
    function opMulMod() public pure {
        assembly {
            let result := mulmod(10,2,3)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x0a
    function opExp() public pure {
        assembly {
            let result := exp(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x0b
    function opSignExtend() public pure {
        assembly {
            let result := signextend(2,8)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
}