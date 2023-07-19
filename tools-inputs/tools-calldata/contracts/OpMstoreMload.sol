// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpMstoreMload {

    uint256 a = 0x12345678912345678912345678912345678912345678912345678912345678;

    function opSimple() public {
        assembly {
            let b := sload(0x0)
            mstore(0xa0, b)
            let c := mload(0xa0)
            sstore(0x1, c)
        }
    }

    function opComplex() public {
        assembly {
            let b := sload(0x0)
            mstore(0xa5, b)
            let c := mload(0xa5)
            sstore(1, c)
        }
    }

    function opCodeCopySimple() public {
        assembly {
            codecopy(0xa0, 10, 32)
            let b := mload(0xa0)
            mstore(0xa5, b)
            let result := mload(0xa0)
            sstore(0x0, result)
        }
    }

    function opCodeCopyComplex() public {
        assembly {
            codecopy(0xa0, 10, 22)
            let b := mload(0xa0)
            mstore(0xa5, b)
            let result := mload(0xa5)
            sstore(0x0, result)
        }
    }

    function opCodeCopyComplex2() public {
        assembly {
            codecopy(0xa0, 10, 22)
            let b := mload(0xa0)
            mstore(0xbe, b)
            let result := mload(0xbe)
            sstore(0x0, result)
        }
    }

    function opCodeCopyComplex3() public {
        assembly {
            codecopy(0xa0, 10, 68)
            let b := mload(0xb0)
            mstore(0xb9, b)
            let result := mload(0xb9)
            sstore(0x0, result)
            result := mload(0xe0)
            sstore(0x1, result)
        }
    }

    function opExtCodeCopySimple(address addr) public {
        assembly {
            extcodecopy(addr, 0xa0, 10, 32)
            let b := mload(0xa0)
            mstore(0xa5, b)
            let result := mload(0xa5)
            sstore(0x0, result)
        }
    }

    function opExtCodeCopyComplex(address addr) public {
        assembly {
            extcodecopy(addr, 0xa0, 10, 22)
            let b := mload(0xa0)
            mstore(0xa5, b)
            let result := mload(0xa5)
            sstore(0x0, result)
        }
    }

    function opExtCodeCopyComplex2(address addr) public {
        assembly {
            extcodecopy(addr, 0xa0, 10, 22)
            let b := mload(0xa0)
            mstore(0xbe, b)
            let result := mload(0xbe)
            sstore(0x0, result)
        }
    }

    function opExtCodeCopyComplex3(address addr) public {
        assembly {
            extcodecopy(addr, 0xa0, 10, 68)
            let b := mload(0xb0)
            mstore(0xb9, b)
            let result := mload(0xb9)
            sstore(0x0, result)
            result := mload(0xe0)
            sstore(0x1, result)
        }
    }

    function auxReturn() external returns(uint256){
        return 0x123456789;
    }
    function opReturnDataCopySimple() external returns (uint256) {
        uint256 aux = this.auxReturn();
        require(aux != 0);
        assembly {
            returndatacopy(0xa0, 0, 29)
            let result := mload(0xa0)
            sstore(0x0, result)
        }
        return aux;
    }

    function opReturnDataCopyComplex() external returns (uint256) {
        uint256 aux = this.auxReturn();
        require(aux != 0);
        assembly {
            returndatacopy(0xa3, 0, 32)
            let result := mload(0xa3)
            sstore(0x0, result)
            result := mload(0xa0)
            sstore(0x1, result)
            result := mload(0xc0)
            sstore(0x2, result)
        }
        return aux;
    }

    function opCallDataCopySimple() public {
        assembly {
            calldatacopy(0xa0, 0, 32)
            let b := mload(0xa0)
            mstore(0xa5, b)
            let result := mload(0xa5)
            sstore(0x0, result)
        }
    }

    function opCallDataCopyComplex() public {
        assembly {
            calldatacopy(0xa0, 10, 22)
            let b := mload(0xa0)
            mstore(0xa5, b)
            let result := mload(0xa0)
            sstore(0x0, result)
            result := mload(0xa5)
            sstore(0x1, result)
        }
    }

    function opCallDataCopyComplex2() public {
        assembly {
            calldatacopy(0xa0, 10, 22)
            let b := mload(0xa0)
            mstore(0xbe, b)
            let result := mload(0xa0)
            sstore(0x0, result)
            result := mload(0xbe)
            sstore(0x1, result)
        }
    }

    function opCallDataCopyComplex3() public {
        assembly {
            calldatacopy(0xa0, 10, 68)
            let b := mload(0xb0)
            mstore(0xb9, b)
            let result := mload(0xb9)
            sstore(0x0, result)
            result := mload(0xe0)
            sstore(0x1, result)
        }
    }

    function opCallDataCopyComplex4() public {
        assembly {
            calldatacopy(0xa0, 30, 70)
            let b := mload(0xb0)
            mstore(0xb9, b)
            let result := mload(0xb9)
            sstore(0x0, result)
            result := mload(0xe0)
            sstore(0x1, result)
        }
    }

    function opCalldataCopyComplex5() public {
        assembly {
            calldatacopy(0xa0, 10, 10)
            let result := mload(0xa0)
            sstore(0x0, result)
            calldatacopy(0xa8, 10, 10)
            result := mload(0xa0)
            sstore(0x1, result)
        }
    }

    function opCalldataCopyComplex6() public {
        assembly {
            calldatacopy(0xa8, 0, 32)
            let result := mload(0xa0)
            sstore(0x0, result)
            result := mload(0xc0)
            sstore(0x1, result)
            calldatacopy(0xa9, 10, 10)
            result := mload(0xa0)
            sstore(0x2, result)
        }
    }

    function opCalldataCopyComplex7() public {
        assembly {
            calldatacopy(0xa0, 0, 32)
            let result := mload(0xa0)
            sstore(0x0, result)
            mstore(0xc0, result)
            result := mload(0xc0)
            sstore(0x1, result)
            calldatacopy(0xb9, 10, 10)
            result := mload(0xa0)
            sstore(0x2, result)
            result := mload(0xb0)
            sstore(0x3, result)
            result := mload(0xc0)
            sstore(0x4, result)
        }
    }

    function auxReturn2() external returns (uint40[5] memory){
        return [0x123456789, 0x123456789, 0x123456789, 0x123456789, 0x123456789];
    }

    function opReturnDataCopyComplex2() external returns (uint40[5] memory) {
        uint40[5] memory aux = this.auxReturn2();
        assembly {
            returndatacopy(0xa0, 0, 64)
            let result := mload(0xbd)
            sstore(0x0, result)
        }
        return aux;
    }

    function opSimple8() public {
        assembly {
            let b := 0x11
            mstore8(0xa0, b)
            let c := mload(0xa0)
            sstore(0x0, c)
        }
    }

    function opComplex8() public {
        assembly {
            let b := sload(0x0)
            mstore8(0xa0, b)
            let c := mload(0xa0)
            sstore(0x0, c)
        }
    }

    function opComplex82() public {
        assembly {
            let b := sload(0x0)
            mstore8(0xa5, b)
            let c := mload(0xa5)
            sstore(1, c)
        }
    }

}
