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
| Total | Generation errors | Ignored | :heavy_check_mark: | :x:  | Coverage |
|:-----:|:-----------------:|:-------:|:------------------:|:----:|:--------:|
| 13282 |       1695        |   1746  |        8336        | 1505 |   72%    |


## Extended table

|             Folder Name              | Total | :heavy_check_mark: | :x: | Ignored | Cov  |
|:------------------------------------:|:-----:|:------------------:|:---:|:-------:|:----:|
|         stArgsZeroOneBalance         |  96   |         96         |  0  |    0    | 100% |
|             stAttackTest             |   2   |         1          |  1  |    0    | 50%  |
|             stBadOpcode              |  203  |        175         | 28  |    0    | 86%  |
|                stBugs                |   9   |         9          |  0  |    0    | 100% |
|             stCallCodes              |  87   |         63         | 24  |    0    | 72%  |
|       stCallCreateCallCodeTest       |  55   |         35         | 20  |    0    | 64%  |
| stCallDelegateCodesCallCodeHomestead |  58   |         37         | 21  |    0    | 64%  |
|     stCallDelegateCodesHomestead     |  58   |         37         | 21  |    0    | 64%  |
|              stChainId               |   2   |         1          |  0  |    1    | 100% |
|            stCodeCopyTest            |   2   |         2          |  0  |    0    | 100% |
|           stCodeSizeLimit            |   5   |         3          |  2  |    0    | 60%  |
|              stCreate2               |  154  |        117         | 21  |   16    | 85%  |
|             stCreateTest             |  95   |         79         | 16  |    0    | 83%  |
|     stDelegatecallTestHomestead      |  31   |         20         | 11  |    0    | 65%  |
|           stEIP150Specific           |  13   |         13         |  0  |    0    | 100% |
|     stEIP150singleCodeGasPrices      |  339  |        335         |  4  |    0    | 99%  |
|              stEIP1559               |   1   |         1          |  0  |    0    | 100% |
|           stEIP158Specific           |   7   |         7          |  0  |    0    | 100% |
|              stEIP2930               |  138  |         6          | 132 |    0    |  4%  |
|              stEIP3607               |   5   |         0          |  5  |    0    |  0%  |
|              stExample               |  38   |         35         |  3  |    0    | 92%  |
|            stExtCodeHash             |  65   |         18         | 47  |    0    | 28%  |
|         stHomesteadSpecific          |   5   |         5          |  0  |    0    | 100% |
|            stInitCodeTest            |  22   |         14         |  8  |    0    | 64%  |
|              stLogTests              |  46   |         46         |  0  |    0    | 100% |
|      stMemExpandingEIP150Calls       |  10   |         8          |  2  |    0    | 80%  |
|          stMemoryStressTest          |  82   |         40         | 42  |    0    | 49%  |
|             stMemoryTest             |  578  |        202         | 126 |   250   | 62%  |
|          stNonZeroCallsTest          |  24   |         24         |  0  |    0    | 100% |
|        stPreCompiledContracts        |  960  |        111         | 823 |   26    | 12%  |
|       stPreCompiledContracts2        |  203  |         51         | 26  |   126   | 66%  |
|      stQuadraticComplexityTest       |  32   |         7          | 25  |    0    | 22%  |
|               stRandom               |  313  |        176         | 137 |    0    | 56%  |
|              stRandom2               |  226  |        121         | 105 |    0    | 54%  |
|          stRecursiveCreate           |   2   |         0          |  2  |    0    |  0%  |
|             stRefundTest             |  26   |         21         |  5  |    0    | 81%  |
|           stReturnDataTest           |  81   |         42         | 39  |    0    | 52%  |
|             stRevertTest             |  271  |        172         | 99  |    0    | 63%  |
|             stSLoadTest              |   1   |         1          |  0  |    0    | 100% |
|             stSStoreTest             |  475  |        467         |  0  |    8    | 100% |
|            stSelfBalance             |   7   |         7          |  0  |    0    | 100% |
|               stShift                |  42   |         32         | 10  |    0    | 76%  |
|            stSolidityTest            |  23   |         14         |  9  |    0    | 61%  |
|            stSpecialTest             |  14   |         7          |  7  |    0    | 50%  |
|             stStackTests             |  375  |        312         | 63  |    0    | 83%  |
|             stStaticCall             |  478  |        303         | 175 |    0    | 63%  |
|         stStaticFlagEnabled          |  34   |         24         | 10  |    0    | 71%  |
|        stSystemOperationsTest        |  69   |         53         | 16  |    0    | 77%  |
|           stTimeConsuming            | 5190  |        4227        | 963 |    0    | 81%  |
|          stTransactionTest           |  168  |        165         |  3  |    0    | 98%  |
|           stTransitionTest           |   6   |         6          |  0  |    0    | 100% |
|             stWalletTest             |  46   |         46         |  0  |    0    | 100% |
|          stZeroCallsRevert           |  16   |         16         |  0  |    0    | 100% |
|           stZeroCallsTest            |  24   |         24         |  0  |    0    | 100% |
|           stZeroKnowledge2           |  519  |         0          |  0  |   519   | 100% |
|           stZeroKnowledge            |  800  |         0          |  0  |   800   | 100% |
|               VMTests                |  651  |        502         | 149 |    0    | 77%  |

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

