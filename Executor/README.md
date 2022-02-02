# Test Vector

## Scenarios
### input_X.json
- id: 0 -> 2 accounts 1 valid tx
- id: 1 -> 5 accounts 5 tx (2 valid)
    - valid tx
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

### input_b_X.json
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

### input_ci_X.json
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

### input_n_X.json
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