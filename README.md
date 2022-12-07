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
- Commit [ethereum/tests](https://github.com/ethereum/tests): 24fa31adb30f71ee700b27decb5204e53a11d9f3
- Commit [zkevm-testvectors](https://github.com/0xPolygonHermez/zkevm-testvectors): 51fce991e0621c4397e122fc6d24794bc10f0fc5
- Commit [zkevm-rom](https://github.com/0xPolygonHermez/zkevm-rom): a428ddc391044032ef285105e52624bc2051dbcb
- Commit [zkevm-proverjs](https://github.com/0xPolygonHermez/zkevm-proverjs): cedc278e4fbc93b84e8ea4008d9fa4ab590ce08f

| Total | Generation errors | Ignored | :heavy_check_mark: | :x: | Coverage |
|:-----:|:-----------------:|:-------:|:------------------:|:---:|:--------:|
| 13294 |        42         |  3598   |        9653        |  1  |  99.55%  |


## Extended table

|             Folder Name              | Total | :heavy_check_mark: | :x: | Ignored | Cov  |
|:------------------------------------:|:-----:|:------------------:|:---:|:-------:|:----:|
|         stArgsZeroOneBalance         |  96   |         94         |  0  |    2    | 100% |
|             stAttackTest             |   2   |         0          |  0  |    2    | 100% |
|             stBadOpcode              |  203  |        172         |  1  |   30    | 99%  |
|                stBugs                |   9   |         7          |  0  |    2    | 100% |
|             stCallCodes              |  87   |         67         |  0  |   20    | 100% |
|       stCallCreateCallCodeTest       |  55   |         39         |  0  |   16    | 100% |
| stCallDelegateCodesCallCodeHomestead |  58   |         41         |  0  |   17    | 100% |
|     stCallDelegateCodesHomestead     |  58   |         41         |  0  |   17    | 100% |
|              stChainId               |   2   |         1          |  0  |    1    | 100% |
|            stCodeCopyTest            |   2   |         2          |  0  |    0    | 100% |
|           stCodeSizeLimit            |   5   |         5          |  0  |    0    | 100% |
|              stCreate2               |  150  |        103         |  1  |   46    | 99%  |
|             stCreateTest             |  91   |         77         |  1  |   13    | 99%  |
|     stDelegatecallTestHomestead      |  31   |         25         |  0  |    6    | 100% |
|           stEIP150Specific           |  25   |         23         |  0  |    2    | 100% |
|     stEIP150singleCodeGasPrices      |  339  |        329         |  0  |   10    | 100% |
|              stEIP1559               |   1   |         0          |  0  |    1    | 100% |
|           stEIP158Specific           |   7   |         4          |  0  |    3    | 100% |
|              stEIP2930               |  138  |         3          |  0  |   135   | 100% |
|              stEIP3607               |   5   |         5          |  0  |    0    | 100% |
|              stExample               |  38   |         33         |  1  |    4    | 97%  |
|            stExtCodeHash             |  65   |         16         |  0  |   49    | 100% |
|         stHomesteadSpecific          |   5   |         5          |  0  |    0    | 100% |
|            stInitCodeTest            |  22   |         20         |  0  |    2    | 100% |
|              stLogTests              |  46   |         46         |  0  |    0    | 100% |
|      stMemExpandingEIP150Calls       |  10   |         10         |  0  |    0    | 100% |
|          stMemoryStressTest          |  82   |         48         |  0  |   34    | 100% |
|             stMemoryTest             |  578  |        223         |  0  |   355   | 100% |
|          stNonZeroCallsTest          |  24   |         20         |  0  |    4    | 100% |
|        stPreCompiledContracts        |  960  |        425         |  0  |   535   | 100% |
|       stPreCompiledContracts2        |  203  |         53         |  2  |   148   | 96%  |
|      stQuadraticComplexityTest       |  32   |         13         |  0  |   19    | 100% |
|               stRandom               |  313  |        169         |  5  |   139   | 97%  |
|              stRandom2               |  226  |        167         |  3  |   56    | 98%  |
|          stRecursiveCreate           |   2   |         2          |  0  |    0    | 100% |
|             stRefundTest             |  26   |         11         |  0  |   15    | 100% |
|           stReturnDataTest           |  81   |         46         |  0  |   35    | 100% |
|             stRevertTest             |  271  |        136         |  0  |   135   | 100% |
|             stSLoadTest              |   1   |         1          |  0  |    0    | 100% |
|             stSStoreTest             |  475  |        467         |  0  |    8    | 100% |
|            stSelfBalance             |   7   |         7          |  0  |    0    | 100% |
|               stShift                |  42   |         40         |  1  |    1    | 98%  |
|            stSolidityTest            |  23   |         18         |  0  |    5    | 100% |
|            stSpecialTest             |  14   |         8          |  2  |    4    | 80%  |
|             stStackTests             |  375  |        202         |  0  |   173   | 100% |
|             stStaticCall             |  478  |        386         | 13  |   79    | 97%  |
|         stStaticFlagEnabled          |  34   |         24         |  0  |   10    | 100% |
|        stSystemOperationsTest        |  69   |         49         |  6  |   14    | 89%  |
|           stTimeConsuming            | 5190  |        5187        |  0  |    3    | 100% |
|          stTransactionTest           |  164  |        149         |  2  |   13    | 99%  |
|           stTransitionTest           |   6   |         6          |  0  |    0    | 100% |
|             stWalletTest             |  46   |         43         |  0  |    3    | 100% |
|          stZeroCallsRevert           |  16   |         12         |  0  |    4    | 100% |
|           stZeroCallsTest            |  24   |         20         |  0  |    4    | 100% |
|           stZeroKnowledge2           |  519  |         0          |  0  |   519   | 100% |
|           stZeroKnowledge            |  800  |         0          |  0  |   800   | 100% |
|               VMTests                |  651  |        553         |  5  |   93    | 99%  |


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