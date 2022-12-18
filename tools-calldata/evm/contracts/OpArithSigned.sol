// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract OpArithSigned {
  int256 public res = 1;

  // opcode 0x05
  function opSDiv() public {
    assembly {
      let result := sdiv(10, 2)
      sstore(0x0, result)
    }
  }

  // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6 -10
  // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb -5
  function opSDivNeg() public {
    int256 auxNegative = -10;
    assembly {
      let result := sdiv(auxNegative, 2)
      sstore(0x0, result)
    }
  }

  // opcode 0x07
  //https://github.com/holiman/uint256/blob/78905e8fd24fbe0d6848cadee69cb96de3054c76/uint256.go#L610
  function opSMod1() public {
    int256 auxNegative = -10;
    int256 auxNegative2 = 3;
    assembly {
      let result := smod(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSMod2() public {
    int256 auxNegative = 10;
    int256 auxNegative2 = -3;
    assembly {
      let result := smod(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSMod3() public {
    int256 auxNegative = -10;
    int256 auxNegative2 = -3;
    assembly {
      let result := smod(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSMod4() public {
    int256 auxNegative = 10;
    int256 auxNegative2 = 3;
    assembly {
      let result := smod(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  // opcode 0x0b

  // opcode 0x12
  function opSLT1() public {
    int256 auxNegative = -10;
    int256 auxNegative2 = 3;
    assembly {
      let result := slt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSLT2() public {
    int256 auxNegative = 10;
    int256 auxNegative2 = -3;
    assembly {
      let result := slt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSLT3() public {
    int256 auxNegative = -10;
    int256 auxNegative2 = -3;
    assembly {
      let result := slt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSLT4() public {
    int256 auxNegative = 10;
    int256 auxNegative2 = 3;
    assembly {
      let result := slt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  // opcode 13
  function opSGT1() public {
    int256 auxNegative = -10;
    int256 auxNegative2 = 3;
    assembly {
      let result := sgt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSGT2() public {
    int256 auxNegative = 10;
    int256 auxNegative2 = -3;
    assembly {
      let result := sgt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSGT3() public {
    int256 auxNegative = -10;
    int256 auxNegative2 = -3;
    assembly {
      let result := sgt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSGT4() public {
    int256 auxNegative = 10;
    int256 auxNegative2 = 3;
    assembly {
      let result := sgt(auxNegative, auxNegative2)
      sstore(0x0, result)
    }
  }

  // opcode 1D
  function opSAR1() public {
    uint256 shiftedBits = 8;
    int256 auxNegative2 = 0x100; // 0001 0000 0000 >> 8 = 1
    assembly {
      let result := sar(shiftedBits, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSAR2() public {
    uint256 shiftedBits = 8;
    int256 auxNegative2 = -0x100; // 1111 0000 0000 >> 8 = -1
    assembly {
      let result := sar(shiftedBits, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSAR3() public {
    uint256 shiftedBits = 264;
    int256 auxNegative2 = 0x100;
    assembly {
      let result := sar(shiftedBits, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSAR4() public {
    uint256 shiftedBits = 264;
    int256 auxNegative2 = -0x100;
    assembly {
      let result := sar(shiftedBits, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSAR5() public {
    uint256 shiftedBits = 1;
    uint256 auxNegative2 = 0x8000000000000000000000000000000000000000000000000000000000000001;
    assembly {
      let result := sar(shiftedBits, auxNegative2)
      sstore(0x0, result)
    }
  }

  // opcode 0x0b: SIGNEXTEND
  function opSIGNEXTEND1() public {
    uint256 negativeByte = 0; // 0000 0000 1000 0000
    int16 auxNegative2 = 0x100; // 0000 0001 0000 0000
    assembly {
      let result := signextend(negativeByte, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSIGNEXTEND2() public {
    uint256 negativeByte = 0; // 0000 0000 1000 0000
    int16 auxNegative2 = -0x100; // 1111 1111 0000 0000
    assembly {
      let result := signextend(negativeByte, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSIGNEXTEND3() public {
    uint256 negativeByte = 1; // 1000 0000 0000 0000
    int16 auxNegative2 = 0x100; // 0000 0001 0000 0000
    assembly {
      let result := signextend(negativeByte, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSIGNEXTEND4() public {
    uint256 negativeByte = 1; // 1000 0000 0000 0000
    int16 auxNegative2 = -0x100; // 1111 1111 0000 0000
    assembly {
      let result := signextend(negativeByte, auxNegative2)
      sstore(0x0, result)
    }
  }

  function opSIGNEXTEND5() public {
    uint256 negativeByte = 264;
    int256 auxNegative2 = -0x100;
    assembly {
      let result := signextend(negativeByte, auxNegative2)
      sstore(0x0, result)
    }
  }
}
