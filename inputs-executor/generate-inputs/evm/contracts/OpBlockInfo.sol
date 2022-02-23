// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: CHECK
contract OpBlockInfo {
    // opcode 0x40
    function opBlockHash() public view {
        assembly {
            let result := blockhash(1)
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x41
    function opCoinbase() public view {
        assembly {
            let result := coinbase()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x42
    function opTimestamp() public view {
        assembly {
            let result := timestamp()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x43
    function opNumber() public view {
        assembly {
            let result := number()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x44
    function opDifficult() public view {
        assembly {
            let result := difficulty()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x45
    function opGasLimit() public view {
        assembly {
            let result := gaslimit()
            mstore(0x0, result)
            return(0x0, 32)
        }
    }
    // opcode 0x46
    // function opChainId() public view {
    //     assembly {
    //         let result := chainid()
    //         mstore(0x0, result)
    //     }
    // }
    // opcode 0x47
    // function opSelfBalance() public view {
    //     assembly {
    //         let result := balance(msg.sender)
    //         mstore(0x0, result)
    //     }
    // }
}