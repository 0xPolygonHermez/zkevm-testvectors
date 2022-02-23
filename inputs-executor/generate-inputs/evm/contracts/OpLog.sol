// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//TODO: REFACTOR & CHECK
contract OpLog {
    // opcode 0xa0
    function opLog0() public payable {
        assembly {
            log0(0, 32)
        }
    }
    // opcode 0xa1
    function opLog1() public payable {
        assembly {
            log1(0, 32, 0)
        }
    }
    // opcode 0xa2
    function opLog2() public payable {
        assembly {
            log2(0, 32, 0, 0)
        }
    }
    // opcode 0xa3
    function opLog3() public payable {
        assembly {
            log3(0, 32, 0, 0, 0)
        }
    }
    // opcode 0xa4
    function opLog4() public payable {
        assembly {
            log4(0, 32, 0, 0, 0, 0)
        }
    }
}