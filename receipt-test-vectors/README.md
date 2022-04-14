## Receipt

### Description
- Exactly the same parameters as the `state-transition` tests
- It also adds information about the `transactions receipt` and the `block information`

### Transaction receipt
```json
"receipt": {
    "transactionHash": "0x0cc3dd49b941271b19df83ba6733bed4023fb82c28d40e6ef863ca589d4a933a",
    "transactionIndex": 0,
    "blockNumber": 0,
    "from": "0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D",
    "to": "0x4d5Cf5032B2a844602278b01199ED191A86c93ff",
    "cumulativeGasUsed": 21000,
    "gasUsedForTx": 21000,
    "contractAddress": null,
    "logs": 0,
    "logsBloom": 0,
    "status": 1,
    "blockHash": "0xd428bcb4a86d605119259aa806372e61a98b210f940d0007a510954ebf01d698"
}
```

### block information
```json
"blockInfo": {
    "blockNumber": 0,
    "gasUsedForTx": 21000,
    "blockGasLimit": 30000000,
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "txHashRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "receiptRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp": 1944498031
}
```