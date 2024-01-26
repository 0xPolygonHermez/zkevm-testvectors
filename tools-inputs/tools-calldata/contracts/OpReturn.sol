// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpReturn {
    uint256 val = 1;
    bytes dataAux = "as";

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

    function simpleReturn() public payable returns (uint256) {
        (bool success, bytes memory data) = address(this).call(
            abi.encodeWithSignature("addTwo()")
        );
        val = abi.decode(data, (uint256));
        return val;
    }

    function addTwo() public payable returns (uint256) {
        return 56;
    }
    
    function invalidReturn() public payable returns (uint256) {
        (bool success2, bytes memory data2) = address(this).call(
            abi.encodeWithSignature("addTwo()")
        );
        (bool success, bytes memory data) = address(this).call(
            abi.encodeWithSignature("addTwoInvalid()")
        );
        assembly {
            let result := returndatasize()
            sstore(val.slot, result)
        }

        if(!success) {
            dataAux = data;
            return val;
        }
        val = abi.decode(data, (uint256));
        return val;
    }

    function addTwoInvalid() public payable returns (uint256) {
         assembly{
            invalid()
        }
    }

    function retVal() external returns (uint) {
      uint a = 1;
      uint b = 2;
      uint result = a + b;
      return result;
    }


}
