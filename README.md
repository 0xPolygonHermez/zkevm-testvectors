# Tests Vectors
This repository aims to provide test vectors for polygon zkevm implementation

[![Check test-vectors](https://github.com/0xPolygonHermez/zkevm-testvectors/actions/workflows/main.yaml/badge.svg)](https://github.com/0xPolygonHermez/zkevm-testvectors/actions/workflows/main.yaml)

Maintained tests:

```
/inputs-executor
/merkle-tree
/mt-bridge
/poseidon
/state-transition
```

## Ethereum test vectors coverage
- Ethereum test targeted are located [here](https://github.com/0xPolygonHermez/ethereum-tests/tree/test-vectors)
> `Ignored` test does not fit in zkEVM implementation. Therefore, it could not be applied to zkEVM.
> More coverage will be added while test are being tested

## Overview
- Commit [ethereum-tests](https://github.com/0xPolygonHermez/ethereum-tests/tree/test-vectors): 91cf1a7982dbcc84fab2a12ed490790b6283a277
- Commit [zkevm-testvectors-internal](https://github.com/0xPolygonHermez/zkevm-testvectors-internal): 30af3f0d88500f9ac78453ac7336ee2076189987
- Commit [zkevm-rom-internal](https://github.com/0xPolygonHermez/zkevm-rom-internal): 8dc3f613de26f380f981d6535cef7da91a17508e
- Commit [zkevm-proverjs-internal](https://github.com/0xPolygonHermez/zkevm-proverjs-internal): fd5ff07d56b3eb0dcd0a1909ca1de5db3ae2ef11

| Total | Generation errors | Ignored | :heavy_check_mark: | :x: | Coverage |
|:-----:|:-----------------:|:-------:|:------------------:|:---:|:--------:|
| 17796	|         31        |	  1693	|        16072       |  0  |   99.47  |


## Extended table

|             Folder Name              | Total | :heavy_check_mark: | :x: | Ignored |  Cov   |
|:------------------------------------:|:-----:|:------------------:|:---:|:-------:|:------:|
|         stArgsZeroOneBalance         |  96   |         94         |  0  |    2    | 100.00 |
|             stAttackTest             |   2   |         0          |  0  |    2    | 100.00 |
|             stBadOpcode              | 4250  |        4089        |  1  |   160   | 99.98  |
|                stBugs                |   9   |         7          |  0  |    2    | 100.00 |
|             stCallCodes              |  87   |         67         |  0  |   20    | 100.00 |
|       stCallCreateCallCodeTest       |  55   |         40         |  0  |   15    | 100.00 |
| stCallDelegateCodesCallCodeHomestead |  58   |         41         |  0  |   17    | 100.00 |
|     stCallDelegateCodesHomestead     |  58   |         41         |  0  |   17    | 100.00 |
|              stChainId               |   2   |         1          |  0  |    1    | 100.00 |
|            stCodeCopyTest            |   2   |         2          |  0  |    0    | 100.00 |
|           stCodeSizeLimit            |   6   |         6          |  0  |    0    | 100.00 |
|              stCreate2               |  174  |        134         |  1  |   39    | 99.26  |
|             stCreateTest             |  173  |        137         |  1  |   35    | 99.28  |
|     stDelegatecallTestHomestead      |  31   |         26         |  0  |    5    | 100.00 |
|           stEIP150Specific           |  25   |         23         |  0  |    2    | 100.00 |
|     stEIP150singleCodeGasPrices      |  339  |        329         |  0  |   10    | 100.00 |
|              stEIP1559               |  44   |         0          |  0  |   44    | 100.00 |
|           stEIP158Specific           |   7   |         4          |  0  |    3    | 100.00 |
|              stEIP2930               |  138  |         8          |  0  |   130   | 100.00 |
|              stEIP3607               |  12   |         12         |  0  |    0    | 100.00 |
|              stExample               |  38   |         34         |  0  |    4    | 100.00 |
|            stExtCodeHash             |  65   |         18         |  0  |   47    | 100.00 |
|         stHomesteadSpecific          |   5   |         5          |  0  |    0    | 100.00 |
|            stInitCodeTest            |  22   |         20         |  0  |    2    | 100.00 |
|              stLogTests              |  46   |         46         |  0  |    0    | 100.00 |
|      stMemExpandingEIP150Calls       |  10   |         10         |  0  |    0    | 100.00 |
|          stMemoryStressTest          |  82   |         79         |  0  |    3    | 100.00 |
|             stMemoryTest             |  578  |        567         |  0  |   11    | 100.00 |
|          stNonZeroCallsTest          |  24   |         20         |  0  |    4    | 100.00 |
|        stPreCompiledContracts        |  960  |        887         |  0  |   73    | 100.00 |
|       stPreCompiledContracts2        |  248  |        127         |  0  |   121   | 100.00 |
|      stQuadraticComplexityTest       |  32   |         18         |  6  |    8    | 75.00  |
|               stRandom               |  313  |        275         |  1  |   37    | 99.64  |
|              stRandom2               |  226  |        207         |  0  |   19    | 100.00 |
|          stRecursiveCreate           |   2   |         2          |  0  |    0    | 100.00 |
|             stRefundTest             |  26   |         12         |  0  |   14    | 100.00 |
|           stReturnDataTest           |  273  |        246         |  0  |   27    | 100.00 |
|             stRevertTest             |  271  |        186         |  0  |   85    | 100.00 |
|             stSLoadTest              |   1   |         1          |  0  |    0    | 100.00 |
|             stSStoreTest             |  475  |        467         |  0  |    8    | 100.00 |
|            stSelfBalance             |  42   |         40         |  0  |    2    | 100.00 |
|               stShift                |  42   |         42         |  0  |    0    | 100.00 |
|            stSolidityTest            |  23   |         18         |  0  |    5    | 100.00 |
|            stSpecialTest             |  22   |         10         |  0  |   12    | 100.00 |
|             stStackTests             |  375  |        375         |  0  |    0    | 100.00 |
|             stStaticCall             |  478  |        405         | 10  |   63    | 97.59  |
|         stStaticFlagEnabled          |  38   |         29         |  0  |    9    | 100.00 |
|        stSystemOperationsTest        |  72   |         54         |  0  |   18    | 100.00 |
|           stTimeConsuming            | 5190  |        5187        |  0  |    3    | 100.00 |
|          stTransactionTest           |  164  |        148         |  0  |   16    | 100.00 |
|           stTransitionTest           |   6   |         6          |  0  |    0    | 100.00 |
|             stWalletTest             |  46   |         44         |  0  |    2    | 100.00 |
|          stZeroCallsRevert           |  16   |         12         |  0  |    4    | 100.00 |
|           stZeroCallsTest            |  24   |         20         |  0  |    4    | 100.00 |
|           stZeroKnowledge2           |  519  |        233         |  0  |   286   | 100.00 |
|           stZeroKnowledge            |  800  |        569         |  0  |   231   | 100.00 |
|               VMTests                |  651  |        581         | 11  |   59    | 98.14  |


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

