pragma solidity 0.8.7;

contract OpLogPcMsize {

    // TODO: This opcodes cannot be called from inline assembly, only from pure Yul objects
    // https://blog.soliditylang.org/2021/06/10/solidity-0.8.5-release-announcement/
    // info:
    // https://docs.soliditylang.org/en/v0.8.7/yul.html#simple-example
    // opcode 0x58
    // function opPC() public {
    //     assembly {
    //         let result := pc()
    //         sstore(0x0, result)
    //     }
    // }

    // opcode 0x59
    function opMsize() public {
        assembly {
            let result := msize()
            sstore(0x0, result)
        }
    }

    // opcode 0xA0
    // LOG0
    event log0 (
        address first,
        uint256 second
    ) anonymous;

    function triggerLog0() public {
        emit log0(
            0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa,
            0x123456789
        );
    }

    // opcode 0xA1
    // LOG1
    event log1 (
        uint256 fi,
        bool sec,
        uint152 thi,
        uint32 fo
    );

    function triggerLog1() public {
        emit log1(
            1 << 255,
            true,
            933874,
            2933847
        );
    }

    // opcode 0xA2
    // LOG2
    event log2 (
        address indexed from,
        bool a,
        bool b,
        bytes2 c,
        bytes3 d,
        bytes4 e
    );

    function triggerLog2() public {
        emit log2(
            address(this),
            false,
            true,
            0xFFFF,
            0xFFFFFF,
            0xFFFFFFFF
        );
    }

    // opcode 0xA3
    // LOG3
    event log3 (
        address indexed from,
        bool indexed a,
        bool b,
        uint8 c,
        uint16 d,
        uint24 e
    );

    function triggerLog3() public {
        emit log3(
            address(this),
            true,
            false,
            0xFF,
            0xFFFF,
            0xFFFFFF
        );
    }

    // opcode 0xA4
    // LOG4
    event log4 (
        address indexed from,
        address indexed to,
        uint indexed value,
        uint8 a,
        bytes1 b,
        uint32 c,
        bytes4 d
    );

    function triggerLog4() public {
        emit log4(
            address(this),
            0x8714E139a7304cDe5Edfc5cf40377FD076764651,
            100000000000000000000,
            0xFF,
            0xFF,
            0xFFFFFFFF,
            0xFFFFFFFF
        );
    }
}