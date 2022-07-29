# Tests Vectors
This repository aims to provide test vectors for polygon-hermez zkevm implementation

[![Check test-vectors](https://github.com/0xPolygonHermez/zkevm-testvectors/actions/workflows/main.yaml/badge.svg)](https://github.com/0xPolygonHermez/zkevm-testvectors/actions/workflows/main.yaml)

> **WARNING**: All code here is in WIP

Maintained tests:

```
/inputs-executor
/merkle-tree
/mt-bridge
/poseidon
/state-transition
```

## Ethereum test vectors coverage
- Ethereum test targeted are located [here](https://github.com/ethereum/tests/tree/develop/BlockchainTests/GeneralStateTests)
> `Ignored` test does not fit in zkEVM implementation. Therefore, it could not be applied to zkEVM.
> More coverage will be added while test are being tested

### Overview
| Total | Generation errors | Ignored | :heavy_check_mark: | :x:  | Coverage |
|:-----:|:-----------------:|:-------:|:------------------:|:----:|:--------:|
| 13434 |       2444        |   160   |        7138        | 3692 |   53%    |

### Extended table
|             Folder Name              |  Total  | :heavy_check_mark: | :x: | Ignored | Coverage |
|:------------------------------------:|:-------:|:------------------:|:---:|:-------:|:--------:|
|         stArgsZeroOneBalance         | Pending |                    |     |         |          |
|             stAttackTest             | Pending |                    |     |         |          |
|             stBadOpcode              |   320   |        129         | 191 |         |   40%    |
|                stBugs                | Pending |                    |     |         |          |
|             stCallCodes              |   87    |         55         | 32  |         |   63%    |
|       stCallCreateCallCodeTest       | Pending |                    |     |         |          |
| stCallDelegateCodesCallCodeHomestead |   58    |         37         | 21  |         |   64%    |
|     stCallDelegateCodesHomestead     |   58    |         37         | 21  |         |   64%    |
|              stChainId               | Pending |                    |     |         |          |
|            stCodeCopyTest            |    2    |         2          |  0  |         |   100%   |
|           stCodeSizeLimit            | Pending |                    |     |         |          |
|              stCreate2               | Pending |                    |     |         |          |
|             stCreateTest             |   101   |         73         | 28  |         |   72%    |
|     stDelegatecallTestHomestead      | Pending |                    |     |         |          |
|           stEIP150Specific           | Pending |                    |     |         |          |
|     stEIP150singleCodeGasPrices      | Pending |                    |     |         |          |
|              stEIP1559               | Pending |                    |     |         |          |
|           stEIP158Specific           |    7    |         7          |  0  |         |   100%   |
|              stEIP2930               | Pending |                    |     |         |          |
|              stEIP3607               | Pending |                    |     |         |          |
|              stExample               | Pending |                    |     |         |          |
|            stExtCodeHash             | Pending |                    |     |         |          |
|         stHomesteadSpecific          |    5    |         5          |  0  |         |   100%   |
|            stInitCodeTest            | Pending |                    |     |         |          |
|              stLogTests              |   46    |         46         |  0  |         |   100%   |
|      stMemExpandingEIP150Calls       | Pending |                    |     |         |          |
|          stMemoryStressTest          | Pending |                    |     |         |          |
|             stMemoryTest             |   578   |       211          | 367 |         |    37%   |
|          stNonZeroCallsTest          |   24    |         24         |  0  |         |   100%   |
|        stPreCompiledContracts        | Pending |                    |     |         |          |
|       stPreCompiledContracts2        | Pending |                    |     |         |          |
|      stQuadraticComplexityTest       | Pending |                    |     |         |          |
|               stRandom               |   314   |        166         | 148 |         |   53%    |
|              stRandom2               | Pending |                    |     |         |          |
|          stRecursiveCreate           | Pending |                    |     |         |          |
|             stRefundTest             | Pending |                    |     |         |          |
|           stReturnDataTest           | Pending |                    |     |         |          |
|             stRevertTest             | Pending |                    |     |         |          |
|             stSLoadTest              |    1    |         1          |  0  |         |   100%   |
|             stSStoreTest             |   475   |        246         | 221 |   8     |   53%    |
|            stSelfBalance             |    8    |         7          |  1  |         |   88%    |
|               stShift                | Pending |                    |     |         |          |
|            stSolidityTest            | Pending |                    |     |         |          |
|            stSpecialTest             | Pending |                    |     |         |          |
|             stStackTests             | Pending |                    |     |         |          |
|             stStaticCall             | Pending |                    |     |         |          |
|         stStaticFlagEnabled          | Pending |                    |     |         |          |
|        stSystemOperationsTest        | Pending |                    |     |         |          |
|           stTimeConsuming            | Pending |                    |     |         |          |
|          stTransactionTest           | Pending |                    |     |         |          |
|           stTransitionTest           |    6    |         6          |  0  |         |   100%   |
|             stWalletTest             |   46    |         46         |  0  |         |   100%   |
|          stZeroCallsRevert           |   16    |         16         |  0  |         |   100%   |
|           stZeroCallsTest            |   24    |         24         |  0  |         |   100%   |
|           stZeroKnowledge            | Pending |                    |     |         |          |
|           stZeroKnowledge2           | Pending |                    |     |         |          |
|               VMTests                | Pending |                    |     |         |          |

## Note
In order to test, the following private keys are being used. This keys are not meant to be used in any production environment:
- private key: `0x28b2b0318721be8c8339199172cd7cc8f5e273800a35616ec893083a4b32c02e`
  - address: `0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D`
- private key: `0x4d27a600dce8c29b7bd080e29a26972377dbb04d7a27d919adbb602bf13cfd23`
  - address: `0x4d5Cf5032B2a844602278b01199ED191A86c93ff`
- private key: `0x1d0722aff4b29780e9a78e0bf28d5e127fb276cfbb0c3eb6a0e1728401777f17`
  - address: `0xeB17ce701E9D92724AA2ABAdA7E4B28830597Dd9`
- private key: `0xd049e68efa0d85a3824c0b79f6817a986bb0cb3a075bcc2699118eca881d70ce`
  - address: `0x187Bd40226A7073b49163b1f6c2b73d8F2aa8478`
- private key: `0x0b929d50d7fda8155539e6befa96ff297e3e9ebce4d908f570310bdf774cb32b`
  - address: `0xabCcEd19d7f290B84608feC510bEe872CC8F5112`

## License

### Copyright
Polygon `zkevm-testvectors` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.

### Disclaimer
This code has not yet been audited, and should not be used in any production systems.

