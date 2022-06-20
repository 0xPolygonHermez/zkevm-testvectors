// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

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

    function opLogCallWithoutRevert() public payable {
        assembly {
            log1(0, 32, 1)
        }
        (bool success, bytes memory data) = address(this).call(abi.encodeWithSignature("opLogCallWithoutRevert2()")
        );
         assembly {
            log2(0, 32, 1, 2)
        }
    }

   function opLogCallWithoutRevert2() public payable {
        assembly {
            log3(0, 32, 4, 5, 6)
        }
    }

    function opLogCallWithRevert() public payable {
        assembly {
            log1(0, 32, 1)
        }
        (bool success, bytes memory data) = address(this).call(abi.encodeWithSignature("opLogCallWithRevert2()")
        );
         assembly {
            log2(0, 32, 1, 2)
        }
    }

    function opLogCallWithRevert2() public payable {
        assembly {
            log3(0, 32, 4, 5, 6)
        }
        require(false);
    }

    function opLogWithRevert() public payable {
        assembly {
            log0(0, 32)
            log1(0, 32, 1)
            log2(0, 32, 2, 0)
            log3(0, 32, 4, 5, 6)
            log4(0, 32, 7, 8, 9, 10)
        }

        require(false);
    }
}