// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpNumberBlockchash {

    uint256 public firstOpNumber;
    uint256 public secondOpNumber;
    bytes32 public firstOpBlockhash;
    bytes32 public secondOpBlockhash;
    bytes32 public zeroBlockchash;
    bytes32 public oneBlockchash;
    bytes32 public twoBlockchash;
    bytes32 public threeBlockhash;
    bytes32 public fourBlockchash;

    function checkStorageOne() public {
        firstOpNumber = block.number;
        firstOpBlockhash = blockhash(block.number - 1);
    }

    function checkStorageTwo() public {
        secondOpNumber = block.number;
        secondOpBlockhash = blockhash(block.number - 1);
    }

    function saveBlockhash() public {
        zeroBlockchash = blockhash(0);
        oneBlockchash = blockhash(1);
        twoBlockchash = blockhash(2);
        threeBlockhash = blockhash(3);
        fourBlockchash = blockhash(4);
    }

    receive() external payable {}
}