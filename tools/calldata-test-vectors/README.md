## calldata
### Description
It takes the [`state-transition.json`](https://github.com/hermeznetwork/test-vectors/blob/main/test-vector-data/state-transition.json) and adds the expected contract call data.
Note that the encode function data is `sendBatch(bytes memory transactions, uint256 maticAmount)` from `ProofOfEfficiency.sol` smart contract
The purpose of this test id to check the full contract calldata given its parameters: `bytes memory transactions`(batchL2Data) & `uint256 maticAmount`

### Params
- `id`: taken from state-transition.json
- `txs`: taken from state-transition.json
- `batchL2Data`: taken from state-transition.json
- `maticAmount (string weis)`: matic tokens to be paid
- `fullCallData (string hex)`: transaction data of `sendBatch` function