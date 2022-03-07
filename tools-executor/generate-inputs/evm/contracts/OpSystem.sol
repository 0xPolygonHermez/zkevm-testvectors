// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//TODO: REFACTOR & CHECK
contract OpSystem {
    // opcode 0xf0
    function opCreate() public payable {
        assembly{
            let newAddress := create(0, 0, 64)
            mstore(0x0, newAddress)
        }
    }
    // opcode 0xf1
    function opCall() public payable {
        assembly{
            let result := call(0, address(), 0, 0, 64, 0, 64)
            mstore(0x0, result)
        }
    }
    // opcode 0xf2
    function opCallCode() public payable {
        assembly{
            let result := callcode(0, address(), 0, 0, 64, 0, 64)
            mstore(0x0, result)
        }
    }
    // opcode 0xf3
    function opReturn() public pure {
        assembly{
            return(0x0, 64)
        }
    }
    // opcode 0xf4
    function opDelegateCall() public payable {
        assembly{
            let result := delegatecall(0, address(), 0, 64, 0, 64)
            mstore(0x0, result)
        }
    }
    // opcode 0xf5
    function opCreate2() public payable {
        assembly{
            let newAddress := create2(0, 0, 64, address())
            mstore(0x0, 20)
        }
    }
    // opcode 0xfa
    function opStaticCall() public view {
        assembly{
            let result := staticcall(0, address(), 0, 64, 0, 64)
            mstore(0x0, result)
        }
    }
    // opcode 0xfd
    function opRevert() public pure {
        assembly{
            revert(0x0, 0x0)
        }
    }
    // opcode 0xfe
    function opInvalid() public pure {
        assembly{
            invalid()
        }
    }
    // opcode 0xff
    function opSelfDestruc() public payable {
        assembly{
            selfdestruct(caller())
        }
    }
}