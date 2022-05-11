pragma solidity =0.5.16;

import "./UniswapV2ERC20.sol";

contract ERC202 is UniswapV2ERC20 {
  constructor(uint256 _totalSupply) public {
    _mint(msg.sender, _totalSupply);
  }
}
