// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract BenchmarkKeccaks {
    function testKeccak256Hash(uint256 count) public pure returns (bytes32) {
        bytes
            memory msg_preimage = "helloworldhelloworldhelloworldhelloworldhelloworldhelloworld1234";
        bytes32 msg_hash;
        for (uint i = 0; i < count; i++) {
            msg_hash = keccak256(msg_preimage);
        }
        return msg_hash;
    }
}
