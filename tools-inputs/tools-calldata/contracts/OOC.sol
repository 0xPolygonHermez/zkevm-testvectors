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

    // set gasLimit = 30000000 & steps = 50000
    function outOfCountersPoseidon(
        uint256 _iterations
    ) public returns (bytes32 res) {
        if (_iterations == 0) {
            _iterations = 50000;
        }
        assembly {
            res := sload(0x00)
        }
        for (uint256 i = 0; i < _iterations; i++) {
            assembly {
                sstore(0x00, i)
            }
        }
        return res;
    }

    // bytesKeccak = 1000000 & gasLimit = 50000
    function outOfCountersKeccaks(
        uint256 _bytes
    ) public pure returns (bytes32 test) {
        if (_bytes == 0) {
            _bytes = 1000000;
        }
        assembly {
            test := keccak256(0, _bytes)
        }
        return test;
    }

    // set number and gas limit
    // gasLimit = 50000 & iterations = 10000
    function outOfCountersSteps(uint256 _iterations) public pure {
        if (_iterations == 0) {
            _iterations = 10000;
        }
        for (uint i = 0; i < _iterations; i++) {
            assembly {
                mstore(0x0, 1234)
            }
        }
    }
}
