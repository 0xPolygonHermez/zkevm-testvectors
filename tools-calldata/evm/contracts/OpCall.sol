// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "./IOpEnv.sol";

contract OpCall{

    IOpEnv openv;

    function opCallExternal(address addr) external returns (uint256) {
        openv = IOpEnv(addr);
        uint256 aux = openv.auxReturn();
        require(aux != 0);
        assembly {
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x0, result)
        }
        return aux;
    }

    function opCallCall(address addr) public {
        uint256 aux = this.opCallExternal(addr);
        require(aux != 0);
    }
}
