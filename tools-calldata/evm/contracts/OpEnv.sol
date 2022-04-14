// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpEnv {

    // constructor() {
    //     address result = address(this);
    //     assembly {
    //         sstore(0x0, result)
    //     }
    // }

    // opcode 0x30
    function opAddress() public {
        address result = address(this);
        assembly {
            sstore(0x0, result)
        }
    }
    // opcode 0x31
    function opBalance() public {
        address a = msg.sender;
        assembly {
            let result := balance(a)
            sstore(0x1, result)
        }
    }
    // opcode 0x32
    function opOrigin() public {
        address result = tx.origin;
         assembly {
            sstore(0x0, result)
         }
    }
    // // opcode 0x33
    function opCaller() public {
        address result = msg.sender;
        assembly {
            sstore(0x0, result)
        }
    }
    // opcode 0x34
    function opCallValue() public payable {
        uint256 result = msg.value;
        assembly {
            sstore(0x0, result)
        }
    }
    // opcode 0x35
    function opCallDataLoad() public {
        assembly {
            let result := calldataload(2)
            sstore(0x0, result)
        }
    }
    // opcode 0x36
    function opCallDataSize() public {
        assembly {
            let result := calldatasize()
            sstore(0x0, result)
        }
    }
    // opcode 0x37
    function opCallDataCopy() public {
        assembly {
            calldatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x0, result)
        }
    }
    // opcode 0x38
    function opCodeSize() public {
        assembly {
            let result := codesize()
            sstore(0x0, result)
        }
    }
    // opcode 0x39
    function opCodeCopy() public {
        assembly {
            codecopy(0, 0, 32)
            let result := mload(0)
            sstore(0x0, result)
        }
    }
    // opcode 0x3a
    function opGasPrice() public {
        assembly {
            let result := gasprice()
            sstore(0x0, result)
        }
    }
    // opcode 0x3b
    function opExtCodeSize(address addr) public {
        assembly {
            let result := extcodesize(addr)
            sstore(0x0, result)
        }
    }
    // opcode 0x3c
    function opExtCodeCopy(address addr) public {
        assembly {
            extcodecopy(addr, 0, 0, 32)
            let result := mload(0)
            sstore(0x0, result)
        }
    }
    // opcode 0x3d
    function auxReturn() external returns(uint256){
        return 0x123456689;
    }
    function opReturnDataSize() public {
        uint256 aux = this.auxReturn();
        require(aux != 0);
        assembly {
            let result := returndatasize()
            sstore(0x0, result)
        }
    }
    // opcode 0x3e
    function opReturnDataCopy() public {
        uint256 aux = this.auxReturn();
        require(aux != 0);
        assembly {
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x0, result)
        }
    }
    // opcode 0x3f
    function opExtCodeHash(address addr) public {
        assembly {
            let result := extcodehash(addr)
            sstore(0x0, result)
        }
    }
}
