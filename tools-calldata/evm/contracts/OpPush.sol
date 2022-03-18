
// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpPush {
    // opcode 0x60
    function opPush1() public pure {
        assembly {
            let num := 0x10
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x61
    function opPush2() public pure {
        assembly {
            let num := 0x1000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x62
    function opPush3() public pure {
        assembly {
            let num := 0x100000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x63
    function opPush4() public pure {
        assembly {
            let num := 0x10000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x64
    function opPush5() public pure {
        assembly {
            let num := 0x1000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x65
    function opPush6() public pure {
        assembly {
            let num := 0x100000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x66
    function opPush7() public pure {
        assembly {
            let num := 0x10000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x67
    function opPush8() public pure {
        assembly {
            let num := 0x1000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x68
    function opPush9() public pure {
        assembly {
            let num := 0x100000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x69
    function opPush10() public pure {
        assembly {
            let num := 0x10000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x6a
    function opPush11() public pure {
        assembly {
            let num := 0x1000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x6b
    function opPush12() public pure {
        assembly {
            let num := 0x100000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x6c
    function opPush13() public pure {
        assembly {
            let num := 0x10000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x6d
    function opPush14() public pure {
        assembly {
            let num := 0x1000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x6e
    function opPush15() public pure {
        assembly {
            let num := 0x100000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x6f
    function opPush16() public pure {
        assembly {
            let num := 0x10000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x70
    function opPush17() public pure {
        assembly {
            let num := 0x1000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x71
    function opPush18() public pure {
        assembly {
            let num := 0x100000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x72
    function opPush19() public pure {
        assembly {
            let num := 0x10000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x73
    function opPush20() public pure {
        assembly {
            let num := 0x1000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x74
    function opPush21() public pure {
        assembly {
            let num := 0x100000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x75
    function opPush22() public pure {
        assembly {
            let num := 0x10000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x76
    function opPush23() public pure {
        assembly {
            let num := 0x1000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x77
    function opPush24() public pure {
        assembly {
            let num := 0x100000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x78
    function opPush25() public pure {
        assembly {
            let num := 0x10000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x79
    function opPush26() public pure {
        assembly {
            let num := 0x1000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x7a
    function opPush27() public pure {
        assembly {
            let num := 0x100000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x7b
    function opPush28() public pure {
        assembly {
            let num := 0x10000000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x7c
    function opPush29() public pure {
        assembly {
            let num := 0x1000000000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x7d
    function opPush30() public pure {
        assembly {
            let num := 0x100000000000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x7e
    function opPush31() public pure {
        assembly {
            let num := 0x10000000000000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
    // opcode 0x7f
    function opPush32() public pure {
        assembly {
            let num := 0x1000000000000000000000000000000000000000000000000000000000000000
            mstore(0x0, num)
            return(0x0, 32)
        }
    }
}
