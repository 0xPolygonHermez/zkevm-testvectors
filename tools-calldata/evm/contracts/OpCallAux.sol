// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "./IOpCallAux.sol";

contract OpCallAux is IOpCallAux {

    function auxReturn() external override returns(uint256){
        return 0x123456689;
    }

    function auxUpdate() external override returns(uint256){
         assembly {
            sstore(0x0, 0x12121212121212121212)
        }
        return 0x123456689;
    }

    function auxUpdateValues() external payable override returns(uint256){
        address send = msg.sender;
        uint256 val = msg.value;
         assembly {
            sstore(0x0, 0x12121212121212121212)
            sstore(0x1, send)
            sstore(0x2, val)
        }
        return 0x123456689;
    }

    function auxFail() external override {
        require(1 == 0);
    }

    function auxStop() external override {
        require(0 == 0);
    }
}