// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract TestCollision {

    uint256 val = 8;
    uint256 val2 = 9;

    function makeDeployAndCall() public returns(address) {
        address addr;
        // Make create 2 with collision
        assembly {
            addr := create2(0, 0xa0, 218, 0x2)
            sstore(0x0, addr)
        }
        // Call create 2 address
        assembly {
            let success := call(gas(), 0x69ea213eb18d02b6a6748167762aecbf2a826972, 0x00, 0x80, 0x04, 0x80, 0x20)
            sstore(0x1, success)
        }
        return addr;
    }
}