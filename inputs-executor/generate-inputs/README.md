# Test Vector
## Units
    - balance: weis
    - value: weis
    - gasLimit: weis
    - gasPrice: weis

## Params
    - id: test identifier
    - description: brief test description
    - arity: number of childs per branch of the merkle tree
    - chainIdSequencer: chain identifier of the sequencer
    - defaultChainId: default chain identifier
    - sequencerAddress: address of the sequencer
    - sequencerPvtKey: private key of the sequencer
    - genesis: array of addresses to create at the beginning of the test
        - address: wallet address
        - pvtKey: wallet private key
        - balance: balance in weis
        - nonce
    - expectedOldRoot: root of the genesis
    - txs: Array of transactions for the test
        - from: source address
        - to: destination address
        - nonce
        - value: amount in weis
        - gasLimit: in weis
        - gasPrice: in weis
        - chainId
        - rawTx: the transaction in raw
    - expectedNewRoot: new root after the transactions 
    - expectedNewLeafs: leafs of the merkle tree after the transactions

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
- id: 5 -> 2 accounts 2 valid tx
- id: 6 -> 2 accounts 3 invalid tx
    - 3 txs with more value than balance
    - Old root equals new root (no tx processed)
- id: 7 -> 2 accounts 0 txs
    - Old root equals new root

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
    - invalid tx: tx.value > blanace

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

### seq-fees.jsjon
- id: 0 --> 2 accounts and 1 valid tx
    -  valid tx: from, to and sequencer are the same
- id: 1 --> 2 accounts and 2 valid tx
    - valid tx
    - valid tx: sequencer is able to do the transaction because the fees are payed at the end of every tx