// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Precompiled {
    bytes32 hashResult;
    address retEcrecover;

    function preSha256_0() public payable {
        hashResult = sha256(abi.encodePacked(uint16(0x1234)));
    }

    function preSha256_1() public payable {
        hashResult = sha256(
            abi.encodePacked(
                uint256(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA),
                uint256(0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB)
            )
        );
    }

    function ripemd160_0() public {
        hashResult = ripemd160(
            abi.encodePacked(
                address(0xc730B028dA66EBB14f20e67c68DD809FBC49890D),
                uint64(100)
            )
        );
    }

    function preEcrecover_0() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 28;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }

    function preEcrecover_1() public {
        bytes32 messHash = 0x456e9aea5e197a1f1af7a3e85a3212fa4049a3ba34c2289b4c860fc0b0c64ef3;
        uint8 v = 5;
        bytes32 r = 0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608;
        bytes32 s = 0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada;

        retEcrecover = ecrecover(messHash, v, r, s);
    }
}