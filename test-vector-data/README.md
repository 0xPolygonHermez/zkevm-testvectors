## Test vectors data
### Description
- Defines a genesis state, apply transactions and gets the final state
- It also contains useful data as sanity check

### Units
- `balance`: weis
- `value`: weis
- `gasLimit`: weis
- `gasPrice`: weis

### Params
- `id (number)`: test identifier
- `description (string)`: brief test description
- `arity (number)`: number of childs per branch of the merkle tree
- `chainIdSequencer (number)`: chain identifier of the sequencer
- `defaultChainId (number)`: default chain identifier
- `sequencerAddress (string hex)`: address of the sequencer
- `genesis`: array of addresses to create at the beginning of the test
    - `address (string hex)`: wallet address
    - `pvtKey (string hex)`: wallet private key
    - `balance (string number)`: balance in weis
    - `nonce (string number)`: initial nonce
    - `bytecode (string hex)`: contract deployed bytecode
    - `abi (array[objects])`: contract abi
- `expectedOldRoot (string hex)`: root of the genesis
- `txs`: Array of transactions for the test
    - `id (number)`: transaction identifier
    - `from (string hex)`: source address
    - `to (string hex)`: destination address
    - `nonce (number)`: nonce to sign
    - `value (string number)`: amount in weis
    - `gasLimit (number)`: gas limit
    - `gasPrice (string number)`: gas price
    - `chainId (number)`: chain identifier
    - `data (string hex)`: data
    - `rawTx (string hex)`: the raw ethereum transaction: `RLP(nonce, gasPrice, gasLimit, to, value, data, v, r, s)`
    - `customRawTx (string hex)`: internal transaction format. The one used to encode a tx and send it to the contract: ` RLP(nonce, gasPrice, gasLimit, to, value, data, vahinID, 0, 0) # v(sign) # r # s`
- `expectedNewRoot (string hex)`: new root after the transactions
- `expectedNewLeafs`: leafs of the merkle tree after the transactions
  - key-value mapping defining the accounts state (balance-nonce) in the tree
  - `balance (string amount)`
  - `nonce (string number)`
- Sanity check data: extra data that could be useful to check
  - `batchL2Data (string hex)`: transaction in customRaw format concatenated
  - `globalExitRoot (string hex)`: global exit root (used to compute `inputHash`)
  - `newLocalExitRoot (string hex)`: new local exit root (used to compute `inputHash`)
  - `inputHash (string hex)`: unique input of the circuit. Should match its computation given the parameters in this test. [Specification here](https://hackmd.io/BEhqFAp3QzW-pSPmY4r0Sg#verifyBatch)
  - `batchHashData (string hex)`: parameter in the `inputHash`. Should match its computation given the parameters in this test. [Specification here](https://hackmd.io/BEhqFAp3QzW-pSPmY4r0Sg#sendBatch)
  - `localExitRoot (string hex)`: old local exit root (used to compute `inputHash`)
  - `timestamp (number)`: used to compute `inputHash`. Represented in UNIX time

## Scenarios
### state-transition.json
- id: 0 -> 2 accounts 1 valid tx
- id: 1 -> 5 accounts 5 tx (2 valid)
    - valid tx
    - tx with same amount as balance
    - tx valid with chain id as GENERIC_CHAIN_ID
    - tx with invalid nonce
    - tx with invalid chain id 0
- id: 2 -> 2 accounts 1 invalid tx
    - tx with more value than balance
    - Old root equals new root (no tx processed)
- id: 3 -> 2 accounts 4 invalid tx
    - tx with same amount as balance
    - Invalid from address
    - Invalid to address
    - Invalid chain id
    - Old root equals new root (no tx processed)
- id: 4 -> 2 accounts 1 invalid tx
    - Invalid signature (wrong encode of the tx)
- id: 5 -> 2 accounts 1 valid tx
    - From and To are the same
- id: 6 -> 2 accounts 3 invalid tx
    - 3 txs with more value than balance
    - Old root equals new root (no tx processed)
- id: 7 -> 2 accounts 1 valid txs
    - Old root equals new root
- id: 8 -> 2 accounts 2 valid txs
    - check sequencer pay fees at the end of every tx
- id: 9 -> 2 accounts 4 valid txs
    - all tx from the same account

### balances.json
- id: 0 -> 2 accounts 1 valid tx
- id: 1 -> 3 accounts 1 valid tx, 1 invalid tx
    - valid tx
    - invalid tx: balance == tx.value
- id: 2 -> 2 accounts 1 valid tx, 1 invalid tx
    - valid tx
    - invalid tx: tx.value > balance
- id: 3 -> 2 accounts 1 invalid tx, 1 valid tx
    - invalid tx: tx.value + tx.gas (bigger value) == balance + 1
    - valid tx: tx.value + tx.gas == balance
- id: 4 -> 2 accounts 1 invalid tx, 1 valid tx
    - invalid tx: tx.value + tx.gas (bigger gas) == balance + 1
    - valid tx: tx.value + tx.gas == balance
- id: 5 -> 2 accounts 1 valid tx, 1 invalid tx
    - valid tx: tx.value == balance-1
    - invalid tx: tx.value > balance

### chain-ids.json
- id: 0 -> 2 accounts 1 valid tx
    - valid tx: chainIdSequencer
- id: 1 -> 2 accounts 2 valid tx
    - valid tx: chainIdSequencer
    - valid tx: defaultChainId
- id: 2 -> 2 accounts 1 valid tx, 1 invalid tx
    - valid tx: chainIdSequencer
    - invalid tx: invalid chainId
- id: 3 -> 2 accounts 1 invalid tx, 1 valid tx
    - invalid tx: invalid chainId
    - valid tx: defaultChainId

### nonces.json
- id: 0 -> 2 accounts 1 valid tx
- id: 1 -> 2 accounts 1 valid tx, 1 invalid tx
    - valid tx
    - invalid tx: lower nonce
- id: 2 -> 2 accounts 1 valid tx, 1 invalid tx
    - valid tx
    - invalid tx: bigger nonce
- id: 3 -> 2 accounts 1 valid tx, 2 invalid tx, 1 valid tx
    - valid tx
    - invalid tx: lower nonce
    - invalid tx: bigger nonce
    - valid tx

### seq-fees.json
- id: 0 --> 2 accounts and 1 valid tx
    -  valid tx: from, to and sequencer are the same
- id: 1 --> 2 accounts and 2 valid tx
    - valid tx
    - valid tx: sequencer is able to do the transaction because the fees are payed at the end of every tx

### txs-calldata.json
- id: 0 -> 2 accounts 1 valid tx (to contract)
- id: 1 -> 2 accounts and 1 valid transaction. (transfer)
- id: 2 -> 2 accounts and 2 valid transaction. (to contract & transfer)
- id: 3 -> 2 accounts and 1 invalid transaction (nonce).
- id: 4 -> 2 accounts and 1 invalid transaction (balance).
- id: 5 -> 2 accounts and 1 invalid transaction (chain Id).
- id: 6 -> 2 accounts and 1 invalid transaction (to).
- id: 7 -> 2 accounts and 1 invalid transaction (from).

### calldata-op-X
- Txs to call functions of `opcode contracts`