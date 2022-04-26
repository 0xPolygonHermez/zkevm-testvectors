// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpCreates {
    function opCreate(bytes memory bytecode, uint length) public returns(address) {
        address addr;
        assembly {
            addr := create(0, 0xa0, length)
            sstore(0x0, addr)
        }
        return addr;
    }

    function opCreate2(bytes memory bytecode, uint length) public returns(address) {
        address addr;
        assembly {
            addr := create2(0, 0xa0, length, 0x2)
            sstore(0x0, addr)
        }
        return addr;
    }
}
