# Test Vector
## Scenarios
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

### Units
    - balance: weis
    - value: weis
    - gasLimit: weis
    - gasPrice: weis

### Params
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