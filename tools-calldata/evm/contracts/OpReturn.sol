// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpReturn {
    uint256 val = 1;

    function opDelegateCallSelfBalance(address addrCall)
        external
        payable
        returns (uint256)
    {
        (bool success, bytes memory data) = addrCall.call{value: msg.value}(
            abi.encodeWithSignature(
                "opDelegateCallSelfBalance(address)",
                addrCall
            )
        );
        val = abi.decode(data, (uint256));
    }

    function simpleReturn() external returns (uint256) {
        (bool success, bytes memory data) = address(this).call(
            abi.encodeWithSignature("addTwo(uint256, uint256)", 2, 3)
        );
        val = abi.decode(data, (uint256));
        return val;
    }

    function addTwo(uint256 a, uint256 b) private view returns (uint256) {
        return a + b;
    }
}
