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

## Overview
- Commit [zkevm-testvectors](https://github.com/0xPolygonHermez/zkevm-testvectors): 919bbf9ea406b55fea94faf4e0a7d96aa20cde57
- Commit [zkevm-rom](https://github.com/0xPolygonHermez/zkevm-rom): 09b2ec3be4a699d3abcc8e5fd99ca50a59c8da17
- Commit [zkevm-proverjs](https://github.com/0xPolygonHermez/zkevm-proverjs): b8e49f0be4239bc1df7eb9a83d7b0c4443e2a1ae

| Total | Generation errors | Ignored | :heavy_check_mark: | :x:  | Coverage |
|:-----:|:-----------------:|:-------:|:------------------:|:----:|:--------:|
| 13282 |        251        |   3065  |        8658        | 1308 |   85%    |


## Extended table

|             Folder Name              | Total | :heavy_check_mark: | :x: | Ignored | Cov  |
|:------------------------------------:|:-----:|:------------------:|:---:|:-------:|:----:|
|         stArgsZeroOneBalance         |  96   |         94         |  0  |    2    | 100% |
|             stAttackTest             |   2   |         0          |  0  |    2    | 100% |
|             stBadOpcode              |  203  |        172         |  6  |   25    | 97%  |
|                stBugs                |   9   |         7          |  0  |    2    | 100% |
|             stCallCodes              |  87   |         60         |  7  |   20    | 90%  |
|       stCallCreateCallCodeTest       |  55   |         32         | 12  |   11    | 73%  |
| stCallDelegateCodesCallCodeHomestead |  58   |         34         |  7  |   17    | 83%  |
|     stCallDelegateCodesHomestead     |  58   |         35         |  6  |   17    | 85%  |
|              stChainId               |   2   |         1          |  0  |    1    | 100% |
|            stCodeCopyTest            |   2   |         2          |  0  |    0    | 100% |
|           stCodeSizeLimit            |   5   |         5          |  0  |    0    | 100% |
|              stCreate2               |  154  |        107         |  3  |   44    | 97%  |
|             stCreateTest             |  95   |         73         |  9  |   13    | 89%  |
|     stDelegatecallTestHomestead      |  31   |         23         |  8  |    0    | 74%  |
|           stEIP150Specific           |  13   |         11         |  0  |    2    | 100% |
|     stEIP150singleCodeGasPrices      |  339  |        326         |  3  |   10    | 99%  |
|              stEIP1559               |   1   |         0          |  1  |    0    |  0%  |
|           stEIP158Specific           |   7   |         4          |  0  |    3    | 100% |
|              stEIP2930               |  138  |         29         | 77  |   32    | 27%  |
|              stEIP3607               |   5   |         0          |  5  |    0    |  0%  |
|              stExample               |  38   |         32         |  6  |    0    | 84%  |
|            stExtCodeHash             |  65   |         14         | 32  |   19    | 30%  |
|         stHomesteadSpecific          |   5   |         4          |  1  |    0    | 80%  |
|            stInitCodeTest            |  22   |         21         |  0  |    1    | 100% |
|              stLogTests              |  46   |         46         |  0  |    0    | 100% |
|      stMemExpandingEIP150Calls       |  10   |         8          |  2  |    0    | 80%  |
|          stMemoryStressTest          |  82   |         44         |  6  |   32    | 88%  |
|             stMemoryTest             |  578  |        221         |  2  |   355   | 99%  |
|          stNonZeroCallsTest          |  24   |         12         |  8  |    4    | 60%  |
|        stPreCompiledContracts        |  960  |        548         | 181 |   231   | 75%  |
|       stPreCompiledContracts2        |  203  |         53         |  9  |   141   | 85%  |
|      stQuadraticComplexityTest       |  32   |         10         | 11  |   11    | 48%  |
|               stRandom               |  313  |        149         | 34  |   130   | 81%  |
|              stRandom2               |  226  |        149         | 31  |   46    | 83%  |
|          stRecursiveCreate           |   2   |         2          |  0  |    0    | 100% |
|             stRefundTest             |  26   |         13         |  0  |   13    | 100% |
|           stReturnDataTest           |  81   |         40         | 10  |   31    | 80%  |
|             stRevertTest             |  271  |        135         |  4  |   132   | 97%  |
|             stSLoadTest              |   1   |         1          |  0  |    0    | 100% |
|             stSStoreTest             |  475  |        467         |  0  |    8    | 100% |
|            stSelfBalance             |   7   |         7          |  0  |    0    | 100% |
|               stShift                |  42   |         32         |  9  |    1    | 78%  |
|            stSolidityTest            |  23   |         17         |  1  |    5    | 94%  |
|            stSpecialTest             |  14   |         6          |  4  |    4    | 60%  |
|             stStackTests             |  375  |        192         | 10  |   173   | 95%  |
|             stStaticCall             |  478  |        368         | 38  |   72    | 91%  |
|         stStaticFlagEnabled          |  34   |         24         |  0  |   10    | 100% |
|        stSystemOperationsTest        |  69   |         48         |  7  |   14    | 87%  |
|           stTimeConsuming            | 5190  |        4227        | 960 |    3    | 81%  |
|          stTransactionTest           |  168  |        148         | 11  |    9    | 93%  |
|           stTransitionTest           |   6   |         6          |  0  |    0    | 100% |
|             stWalletTest             |  46   |         43         |  0  |    3    | 100% |
|          stZeroCallsRevert           |  16   |         12         |  0  |    4    | 100% |
|           stZeroCallsTest            |  24   |         12         |  8  |    4    | 60%  |
|           stZeroKnowledge2           |  519  |         0          |  0  |   519   | 100% |
|           stZeroKnowledge            |  800  |         0          |  0  |   800   | 100% |
|               VMTests                |  651  |        532         | 30  |   89    | 95%  |

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

