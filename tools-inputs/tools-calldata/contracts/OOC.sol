// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OOC {
    uint256 public count = 0;

    // set gasLimit = 50000 & steps = 100
    function outOfGas(uint256 _iterations) public {
        if (_iterations == 0) {
            _iterations = 100;
        }
        for (uint256 i = 0; i < _iterations; i++) {
            assembly {
                sstore(0x00, i)
            }
        }
    }

    function outOfCountersPoseidon(
        uint256 _iterations
    ) public returns (bytes32 res) {
        if (_iterations == 0) {
            _iterations = 5000000;
        }
        assembly {
            res := sload(0x00)
        }
        for (uint256 i = 0; i < _iterations; i++) {
            assembly {
                sstore(0x00, i)
                sstore(0x00, i)
                sstore(0x00, i)
            }
        }
        return res;
    }

    function outOfCountersKeccaks(
        uint256 _bytes
    ) public pure returns (bytes32 test) {
        if (_bytes == 0) {
            _bytes = 1000000;
        }
        assembly {
            test := keccak256(0, _bytes)
            test := keccak256(0, _bytes)
            test := keccak256(0, _bytes)
        }
        return test;
    }

    // set number and gas limit
    function outOfCountersSteps(uint256 _iterations) public pure {
        if (_iterations == 0) {
            _iterations = 100000;
        }
        for (uint i = 0; i < _iterations; i++) {
            assembly {
                mstore(0x0, 1234)
            }
        }
    }
}
