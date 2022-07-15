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

|             Folder Name              |  Total  | :heavy_check_mark: | :x: | Ignored | Coverage |
|:------------------------------------:|:-------:|:------------------:|:---:|:-------:|:--------:|
|         stArgsZeroOneBalance         | Pending |                    |     |         |          |
|             stAttackTest             | Pending |                    |     |         |          |
|             stBadOpcode              | Pending |                    |     |         |          |
|                stBugs                | Pending |                    |     |         |          |
|             stCallCodes              | Pending |                    |     |         |          |
|       stCallCreateCallCodeTest       | Pending |                    |     |         |          |
| stCallDelegateCodesCallCodeHomestead | Pending |                    |     |         |          |
|     stCallDelegateCodesHomestead     | Pending |                    |     |         |          |
|              stChainId               | Pending |                    |     |         |          |
|            stCodeCopyTest            | Pending |                    |     |         |          |
|           stCodeSizeLimit            | Pending |                    |     |         |          |
|              stCreate2               | Pending |                    |     |         |          |
|             stCreateTest             | Pending |                    |     |         |          |
|     stDelegatecallTestHomestead      | Pending |                    |     |         |          |
|           stEIP150Specific           | Pending |                    |     |         |          |
|     stEIP150singleCodeGasPrices      | Pending |                    |     |         |          |
|              stEIP1559               | Pending |                    |     |         |          |
|           stEIP158Specific           | Pending |                    |     |         |          |
|              stEIP2930               | Pending |                    |     |         |          |
|              stEIP3607               | Pending |                    |     |         |          |
|              stExample               | Pending |                    |     |         |          |
|            stExtCodeHash             | Pending |                    |     |         |          |
|         stHomesteadSpecific          | Pending |                    |     |         |          |
|            stInitCodeTest            | Pending |                    |     |         |          |
|              stLogTests              | Pending |                    |     |         |          |
|      stMemExpandingEIP150Calls       | Pending |                    |     |         |          |
|          stMemoryStressTest          | Pending |                    |     |         |          |
|             stMemoryTest             | Pending |                    |     |         |          |
|          stNonZeroCallsTest          | Pending |                    |     |         |          |
|        stPreCompiledContracts        | Pending |                    |     |         |          |
|       stPreCompiledContracts2        | Pending |                    |     |         |          |
|      stQuadraticComplexityTest       | Pending |                    |     |         |          |
|               stRandom               | Pending |                    |     |         |          |
|              stRandom2               | Pending |                    |     |         |          |
|          stRecursiveCreate           | Pending |                    |     |         |          |
|             stRefundTest             | Pending |                    |     |         |          |
|           stReturnDataTest           | Pending |                    |     |         |          |
|             stRevertTest             | Pending |                    |     |         |          |
|             stSLoadTest              | Pending |                    |     |         |          |
|             stSStoreTest             | Pending |                    |     |         |          |
|            stSelfBalance             | Pending |                    |     |         |          |
|               stShift                | Pending |                    |     |         |          |
|            stSolidityTest            | Pending |                    |     |         |          |
|            stSpecialTest             | Pending |                    |     |         |          |
|             stStackTests             | Pending |                    |     |         |          |
|             stStaticCall             | Pending |                    |     |         |          |
|         stStaticFlagEnabled          | Pending |                    |     |         |          |
|        stSystemOperationsTest        | Pending |                    |     |         |          |
|           stTimeConsuming            | Pending |                    |     |         |          |
|          stTransactionTest           | Pending |                    |     |         |          |
|           stTransitionTest           | Pending |                    |     |         |          |
|             stWalletTest             | Pending |                    |     |         |          |
|          stZeroCallsRevert           | Pending |                    |     |         |          |
|           stZeroCallsTest            | Pending |                    |     |         |          |
|           stZeroKnowledge            | Pending |                    |     |         |          |
|           stZeroKnowledge2           | Pending |                    |     |         |          |

## License
Copyright
Polygon `zkevm-testvectors` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.
Disclaimer
This code has not yet been audited, and should not be used in any production systems.