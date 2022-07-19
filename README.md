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
> `Ignored` test does not fit in zkEVM implementation. Therefore, it could not eb applied to zkEVM.
> More coverage will be added while test are being tested

|             Folder Name              |  Total  | :heavy_check_mark: | :x: | Ignored | Coverage |
|:------------------------------------:|:-------:|:------------------:|:---:|:-------:|:--------:|
|         stArgsZeroOneBalance         | Pending |                    |     |         |          |
|             stAttackTest             | Pending |                    |     |         |          |
|             stBadOpcode              | 320 |     129               |  191   |         |    40%      |
|                stBugs                | Pending |                    |     |         |          |
|             stCallCodes              | 87 |        53            |  16   |         |     61%     |
|       stCallCreateCallCodeTest       | Pending |                    |     |         |          |
| stCallDelegateCodesCallCodeHomestead | 58 |    34                |  24   |         |    59%      |
|     stCallDelegateCodesHomestead     | 58 |    37                |  21   |         |    64%      |
|              stChainId               | Pending |                    |     |         |          |
|            stCodeCopyTest            | 2 |       2             |  0   |         |    100%      |
|           stCodeSizeLimit            | Pending |                    |     |         |          |
|              stCreate2               | Pending |                    |     |         |          |
|             stCreateTest             | 101 |        65            |  36   |        |    64%      |
|     stDelegatecallTestHomestead      | Pending |                    |     |         |          |
|           stEIP150Specific           | Pending |                    |     |         |          |
|     stEIP150singleCodeGasPrices      | Pending |                    |     |         |          |
|              stEIP1559               | Pending |                    |     |         |          |
|           stEIP158Specific           | 7 |       7             |  0   |         |    100%      |
|              stEIP2930               | Pending |                    |     |         |          |
|              stEIP3607               | Pending |                    |     |         |          |
|              stExample               | Pending |                    |     |         |          |
|            stExtCodeHash             | Pending |                    |     |         |          |
|         stHomesteadSpecific          | 5 |       5             |  0   |         |    100%      |
|            stInitCodeTest            | Pending |                    |     |         |          |
|              stLogTests              | 46 |       46             |  0   |         |  100%        |
|      stMemExpandingEIP150Calls       | Pending |                    |     |         |          |
|          stMemoryStressTest          | Pending |                    |     |         |          |
|             stMemoryTest             | Pending |                    |     |         |          |
|          stNonZeroCallsTest          | 24 |        24            |  0   |         |   100%       |
|        stPreCompiledContracts        | Pending |                    |     |         |          |
|       stPreCompiledContracts2        | Pending |                    |     |         |          |
|      stQuadraticComplexityTest       | Pending |                    |     |         |          |
|               stRandom               | 314 |         166           |  148   |         |    53%      |
|              stRandom2               | Pending |                    |     |         |          |
|          stRecursiveCreate           | Pending |                    |     |         |          |
|             stRefundTest             | Pending |                    |     |         |          |
|           stReturnDataTest           | Pending |                    |     |         |          |
|             stRevertTest             | Pending |                    |     |         |          |
|             stSLoadTest              | 1 |         1           | 0    |         |    100%      |
|             stSStoreTest             | 475 |       135             |  340   |         |     28%     |
|            stSelfBalance             | 8 |          7          |  1   |         |      88%    |
|               stShift                | Pending |                    |     |         |          |
|            stSolidityTest            | Pending |                    |     |         |          |
|            stSpecialTest             | Pending |                    |     |         |          |
|             stStackTests             | Pending |                    |     |         |          |
|             stStaticCall             | Pending |                    |     |         |          |
|         stStaticFlagEnabled          | Pending |                    |     |         |          |
|        stSystemOperationsTest        | Pending |                    |     |         |          |
|           stTimeConsuming            | Pending |                    |     |         |          |
|          stTransactionTest           | Pending |                    |     |         |          |
|           stTransitionTest           | 6 |          6          |  0   |         |    100%      |
|             stWalletTest             | Pending |                    |     |         |          |
|          stZeroCallsRevert           | 16 |         16           |  0   |         |    100%      |
|           stZeroCallsTest            | 24 |         24           |  0   |         |    100%      |
|           stZeroKnowledge            | Pending |                    |     |         |          |
|           stZeroKnowledge2           | Pending |                    |     |         |          |

## License
Copyright
Polygon `zkevm-testvectors` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.
Disclaimer
This code has not yet been audited, and should not be used in any production systems.