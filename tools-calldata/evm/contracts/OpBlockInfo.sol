// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpBlockInfo {

    address public testCoinbase;
    bytes32 public testBlockhash;
    uint256 public test;

    // opcode 0x40
    function opBlockHash(uint256 numBatch) public {
        assembly {
            let result := blockhash(numBatch)
            sstore(0x1, result)
        }
    }
    // opcode 0x41
    function opCoinbase() public {
        assembly {
            let result := coinbase()
            sstore(0x0, result)
        }
    }
    // opcode 0x42
    function opTimestamp() public {
        assembly {
            let result := timestamp()
            sstore(0x2, result)
        }
    }
    // opcode 0x43
    function opNumber() public {
        assembly {
            let result := number()
            sstore(0x2, result)
        }
    }
    // opcode 0x44
    function opDifficulty() public {
        assembly {
            let result := difficulty()
            sstore(0x2, result)
        }
    }
    // opcode 0x45
    function opGasLimit() public {
        assembly {
            let result := gaslimit()
            sstore(0x2, result)
        }
    }
    // opcode 0x46
    function opChainId() public {
        assembly {
            let result := chainid()
            sstore(0x2, result)
        }
    }
    // opcode 0x47
    function opSelfBalance() public {
        assembly {
            let result := selfbalance()
            sstore(0x2, result)
        }
    }

    receive() external payable {}
}