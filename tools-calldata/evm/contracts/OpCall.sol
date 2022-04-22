// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "./IOpCallAux.sol";

contract OpCall{

    IOpCallAux openv;

    function opCallExternal(address addr) external returns (uint256) {
        openv = IOpCallAux(addr);
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

    function opCallCallReturn(address addr) external returns (uint256) {
        uint256 aux = this.opCallExternal(addr);
        require(aux != 0);
        assembly {
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x1, result)
        }
        return aux;
    }

    function opCallCallReturnCall(address addr) public {
        uint256 aux = this.opCallCallReturn(addr);
        require(aux != 0);
        assembly {
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x2, result)
        }
    }

    function opCallExternalUpdate(address addr) external returns (uint256) {
        openv = IOpCallAux(addr);
        uint256 aux = openv.auxUpdate();
        require(aux != 0);
        assembly {
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x1, result)
        }
        return aux;
    }

    function opCallExternalUpdateValues(address addr) external returns (uint256) {
        openv = IOpCallAux(addr);
        uint256 aux = openv.auxUpdateValues();
        require(aux != 0);
        assembly {
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x3, result)
        }
        return aux;
    }

    bytes32 constant auxReturn = 0x6aecbc3300000000000000000000000000000000000000000000000000000000;
    bytes32 constant auxUpdate = 0x3182d9a900000000000000000000000000000000000000000000000000000000;
    bytes32 constant auxUpdateValues = 0xf80efde500000000000000000000000000000000000000000000000000000000;

    function opCallOpcode(address addr) public {
        assembly {
            mstore(0x80, auxUpdate)
            let success := call(gas(), addr, 0x00, 0x80, 0x04, 0x80, 0x20)
            returndatacopy(0, 22, 10)
            let result := mload(0)
            sstore(0x1, result)
        }
    }

    function opCall2(address addr) public {
        assembly {
            mstore(0x80, auxUpdate)
            let success := call(gas(), addr, 0x00, 0x80, 0x04, 0x80, 0x20)
            returndatacopy(23, 22, 10)
            let result := mload(0)
            sstore(0x1, result)
            result := mload(32)
            sstore(0x2, result)
        }
    }

    function opCallCode(address addr) public {
        assembly {
            mstore(0x80, auxUpdate)
            let success := callcode(gas(), addr, 0x00, 0x80, 0x04, 0x80, 0x20)
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x1, result)
        }
    }

    function opCallCodeValues(address addr) external payable returns(uint256) {
        assembly {
            mstore(0x80, auxUpdateValues)
            let success := callcode(gas(), addr, 0x00, 0x80, 0x04, 0x80, 0x20)
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x3, result)
        }
        return 0x44332211;
    }

    function opDelegateCall(address addr) external payable returns(uint256) {
        assembly {
            mstore(0x80, auxUpdateValues)
            let success := delegatecall(gas(), addr, 0x80, 0x04, 0x80, 0x20)
            returndatacopy(0, 0, 32)
            let result := mload(0)
            sstore(0x3, result)
        }
        return 0x11223344;
    }

    function opCallCallCodeValues(address addr) public payable {
        uint256 aux = this.opCallCodeValues(addr);
        require(aux != 0);
        assembly {
            sstore(0x4, aux)
        }
    }

    function opCallDelegateCall(address addr) public payable {
        uint256 aux = this.opDelegateCall(addr);
        require(aux != 0);
        assembly {
            sstore(0x4, aux)
        }
    }

    function opStaticCall(address addr) public {
        assembly {
            mstore(0x80, auxReturn)
            let success := staticcall(gas(), addr, 0x80, 0x04, 0x80, 0x20)
            returndatacopy(0, 22, 10)
            let result := mload(0)
            sstore(0x1, result)
        }
    }

    function opStaticCallFail(address addr) public {
        assembly {
            mstore(0x80, auxUpdate)
            let success := staticcall(gas(), addr, 0x80, 0x04, 0x80, 0x20)
            // TODO: RETURN ERROR?
            // returndatacopy(0, 22, 10)
            // let result := mload(0)
            // sstore(0x1, result)
        }
    }

    function opCallStop(address addr) public {
        openv = IOpCallAux(addr);
        openv.auxStop();
    }

// bytes32 constant auxCallCall = 0x102ea40b0000000000000000000000001275fbb540c8efc58b812ba83b0d0b8b;
// bytes32 constant auxCallCall2 = 0x9917ae9800000000000000000000000000000000000000000000000000000000;

    function opCallFail(address addr) external returns(uint256){
        openv = IOpCallAux(addr);
        openv.auxFail();
        return 0x11;
    }


    function opCallFailParams(address addr) external returns(uint256){
        uint256 success;
        assembly {
            mstore(0x80, auxUpdate)
            success := call(gas(), addr, 0xffffffffffff, 0x80, 0x04, 0x80, 0x20)
        }
        return success;
    }

    function opCallCallFail(address addr) public {
        uint256 aux = this.opCallFailParams(addr);
        require(aux != 0);
    }
}