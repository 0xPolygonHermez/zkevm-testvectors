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
- Commit [ethereum/tests](https://github.com/ethereum/tests): 9d91961e98e97ba319e089f31388d4685da9b362
- Commit [zkevm-testvectors](https://github.com/0xPolygonHermez/zkevm-testvectors): acaed63b50f40d22716fc4501fc5ddaadab4ed64
- Commit [zkevm-rom](https://github.com/0xPolygonHermez/zkevm-rom): eac36484881915b89b9e44c194c6bf59f1dac89b
- Commit [zkevm-proverjs](https://github.com/0xPolygonHermez/zkevm-proverjs): 35116912300faa5a4e7de462ff8cd0a48201dea3

| Total | Generation errors | Ignored | :heavy_check_mark: | :x:  | Coverage |
|:-----:|:-----------------:|:-------:|:------------------:|:----:|:--------:|
| 13282 |        185        |   3173  |        9799        |  125 |   97%    |


## Extended table

|             Folder Name              | Total | :heavy_check_mark: | :x: | Ignored |  Cov |
|:------------------------------------:|:-----:|:------------------:|:---:|:-------:| ----:|
|         stArgsZeroOneBalance         |  96   |         94         |  0  |    2    | 100% |
|             stAttackTest             |   2   |         0          |  0  |    2    | 100% |
|             stBadOpcode              |  203  |        172         |  6  |   25    |  97% |
|                stBugs                |   9   |         7          |  0  |    2    | 100% |
|             stCallCodes              |  87   |         67         |  0  |   20    | 100% |
|       stCallCreateCallCodeTest       |  55   |         38         |  6  |   11    |  86% |
| stCallDelegateCodesCallCodeHomestead |  58   |         41         |  0  |   17    | 100% |
|     stCallDelegateCodesHomestead     |  58   |         41         |  0  |   17    | 100% |
|              stChainId               |   2   |         1          |  0  |    1    | 100% |
|            stCodeCopyTest            |   2   |         2          |  0  |    0    | 100% |
|           stCodeSizeLimit            |   5   |         5          |  0  |    0    | 100% |
|              stCreate2               |  154  |        107         |  3  |   44    |  97% |
|             stCreateTest             |  95   |         73         |  9  |   13    |  89% |
|     stDelegatecallTestHomestead      |  31   |         26         |  5  |    0    |  84% |
|           stEIP150Specific           |  13   |         11         |  0  |    2    | 100% |
|     stEIP150singleCodeGasPrices      |  339  |        328         |  1  |   10    | 100% |
|              stEIP1559               |   1   |         0          |  0  |    1    | 100% |
|           stEIP158Specific           |   7   |         4          |  0  |    3    | 100% |
|              stEIP2930               |  138  |         3          |  0  |   135   | 100% |
|              stEIP3607               |   5   |         0          |  5  |    0    |   0% |
|              stExample               |  38   |         32         |  4  |    2    |  89% |
|            stExtCodeHash             |  65   |         17         | 29  |   19    |  37% |
|         stHomesteadSpecific          |   5   |         4          |  1  |    0    |  80% |
|            stInitCodeTest            |  22   |         21         |  0  |    1    | 100% |
|              stLogTests              |  46   |         46         |  0  |    0    | 100% |
|      stMemExpandingEIP150Calls       |  10   |         9          |  1  |    0    |  90% |
|          stMemoryStressTest          |  82   |         44         |  6  |   32    |  88% |
|             stMemoryTest             |  578  |        217         |  6  |   355   |  97% |
|          stNonZeroCallsTest          |  24   |         12         |  8  |    4    |  60% |
|        stPreCompiledContracts        |  960  |        668         | 61  |   231   |  92% |
|       stPreCompiledContracts2        |  203  |         54         |  8  |   141   |  87% |
|      stQuadraticComplexityTest       |  32   |         11         | 10  |   11    |  52% |
|               stRandom               |  313  |        154         | 29  |   130   |  84% |
|              stRandom2               |  226  |        152         | 28  |   46    |  84% |
|          stRecursiveCreate           |   2   |         2          |  0  |    0    | 100% |
|             stRefundTest             |  26   |         11         |  0  |   15    | 100% |
|           stReturnDataTest           |  81   |         46         |  4  |   31    |  92% |
|             stRevertTest             |  271  |        136         |  3  |   132   |  98% |
|             stSLoadTest              |   1   |         1          |  0  |    0    | 100% |
|             stSStoreTest             |  475  |        467         |  0  |    8    | 100% |
|            stSelfBalance             |   7   |         7          |  0  |    0    | 100% |
|               stShift                |  42   |         40         |  1  |    1    |  98% |
|            stSolidityTest            |  23   |         18         |  0  |    5    | 100% |
|            stSpecialTest             |  14   |         6          |  4  |    4    |  60% |
|             stStackTests             |  375  |        202         |  0  |   173   | 100% |
|             stStaticCall             |  478  |        387         | 19  |   72    |  95% |
|         stStaticFlagEnabled          |  34   |         24         |  0  |   10    | 100% |
|        stSystemOperationsTest        |  69   |         49         |  6  |   14    |  89% |
|           stTimeConsuming            | 5190  |        5187        |  0  |    3    | 100% |
|          stTransactionTest           |  168  |        148         | 11  |    9    |  93% |
|           stTransitionTest           |   6   |         6          |  0  |    0    | 100% |
|             stWalletTest             |  46   |         43         |  0  |    3    | 100% |
|          stZeroCallsRevert           |  16   |         12         |  0  |    4    | 100% |
|           stZeroCallsTest            |  24   |         12         |  8  |    4    |  60% |
|           stZeroKnowledge2           |  519  |         0          |  0  |   519   | 100% |
|           stZeroKnowledge            |  800  |         0          |  0  |   800   | 100% |
|               VMTests                |  651  |        534         | 28  |   89    |  95% |


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