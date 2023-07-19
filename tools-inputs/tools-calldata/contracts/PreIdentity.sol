// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract PreIdentity {
    bytes32 hashResult;
    address retEcrecover;
    bytes dataResult;

    function identity_0(bytes memory data) public {
        bytes memory ret = new bytes(data.length);
        assembly {
            let len := mload(data)
            if iszero(call(gas(), 0x04, 0, add(data, 0x20), len, add(ret,0x20), len)) {
                invalid()
            }
        }
        dataResult = ret;
    }

    function identity_1(bytes memory data) public {
        bytes memory ret = new bytes(data.length);
        assembly {
            let len := mload(data)
            let res := call(gas(), 0x04, 0, add(data, 0x20), len, add(ret,0x20), len)
            sstore(0x5, res)
        }
        dataResult = ret;
    }
}