// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OpEnv {
    // opcode 0x30
    function opAddress() public view {
        assembly {
            let result := address()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x31
    function opBalance() public view {
        assembly {
            let a := address()
            let result := balance(a)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x32
    function opOrigin() public view {
        assembly {
            let result := origin()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x33
    function opCaller() public view {
        assembly {
            let result := caller()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x34
    function opCallValue() public view {
        assembly {
            let result := callvalue()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x35
    function opCallDataLoad() public pure {
        assembly {
            let result := calldataload(0)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x36
    function opCallDataSize() public pure {
        assembly {
            let result := calldatasize()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x37
    function opCallDataCopy() public pure {
        assembly {
            calldatacopy(0, 0, 32)
            return(0x0, 32)
        }
    }
    // opcode 0x38
    function opCodeSize() public pure {
        assembly {
            let result := codesize()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x39
    function opCodeCopy() public pure {
        assembly {
            let result := codesize()
            codecopy(0, 0, result)
            return(0x0, result)
        }
    }
    // opcode 0x3a
    function opGasPrice() public view {
        assembly {
            let result := gasprice()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x3b
    function opExtCodeSize() public view {
        assembly {
            let result := extcodesize(address())
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x3c
    function opExtCodeCopy() public view {
        assembly {
            let result := extcodesize(address())
            extcodecopy(address(), 0, 0, result)
            return(0x0, result)
        }
    }
    // opcode 0x3d
    function opReturnDataSize() public pure {
        assembly {
            let result := returndatasize()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x3e
    function opReturnDataCopy() public pure {
        assembly {
            let result := returndatasize()
            returndatacopy(0, 0, result)
            return(0x0, result)
        }
    }
    // opcode 0x3f
    function opExtCodeHash() public view {
        assembly {
            let result := extcodehash(address())
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
}
