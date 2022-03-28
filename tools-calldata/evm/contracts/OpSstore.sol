// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpSstore {

    uint256 public ret0 = 0;
    uint256 public ret2 = 2;

    // opcode 0x55
    function opSstore0() public payable {
        assembly {
            sstore(0x0, 0)
        }
    }
    function opSstore1() public payable {
        assembly {
            sstore(0x1, 0)
        }
    }
    function opSstore2() public payable {
        assembly {
            sstore(0x0, 2)
        }
    }
    function opSstore3() public payable {
        assembly {
            sstore(0x1, 2)
        }
    }
    // 4, globalHash
    function opSstore020() public payable {
        assembly {
            sstore(0x0, 2)
            sstore(0x0, 0)
        }
    }
    function opSstore002() public payable {
        assembly {
            sstore(0x0, 0)
            sstore(0x0, 2)
        }
    }
    function opSstore022() public payable {
        assembly {
            sstore(0x0, 2)
            sstore(0x0, 2)
        }
    }
    // 7, globalHash
    function opSstore202() public payable {
        assembly {
            sstore(0x1, 0)
            sstore(0x1, 2)
        }
    }
    function opSstore220() public payable {
        assembly {
            sstore(0x1, 2)
            sstore(0x1, 0)
        }
    }
    function opSstore200() public payable {
        assembly {
            sstore(0x1, 0)
            sstore(0x1, 0)
        }
    }
}
