// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpCallRevert {
  uint256 public res;

  function callRevert() public {
    bytes memory selector = abi.encodePacked(this.funcRevert.selector); 
    assembly {
      let success := call(gas(), address(), 0, add(selector, 32), mload(selector), 0, 0)
    }
  }

  function callRevertRevert() public {
    this.funcRevert();
  }

  function funcRevert() external {
    res = 10;
    require(false);
  }
}
