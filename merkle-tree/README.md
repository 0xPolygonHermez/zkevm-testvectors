## smt-genesis
### Description
Add ethereum address leaves on the smt to create a genesis state

### Params
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `addresses (array[object])`: list of objevts that defines the addresses to add to the smt and its values
  - `address (hex string)`: ethereum address
  - `balance (string weis)`: initial balance
  - `nonce (string number)`: initial nonce
- `expectedRoot (string number)`: final smt root once addresses are added

## smt-hash-bytecode
### Description
Performs the bytecode hash of a smart contract bytecode as it is specified in https://hackmd.io/YoVxY0FyQ96dBV_2inaquw?both#SC-Code

### Params
- `bytecode (hex string)`: smart contract bytecode
- `expectHash (hex string)`: bytecode hash

## smt-key-contract-code
### Description
Compute smt path of an ethereum address

### Params
- `leafType (number)`: leaf type to add to the merkle tree
- `ethAddr (hex string)`: list of objects that defines the addresses to add to the smt and its v
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `expectedKey (string number)`: smt key path computed

## smt-key-contract-storage
### Description
Compute smt path of a smart contract storage

### Params
- `leafType (number)`: leaf type to add to the merkle tree
- `ethAddr (hex string)`: list of objects that defines the addresses to add to the smt and its v
- `storagePosition (string number)`: smart contract storage position
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `expectedKey (string number)`: smt key path computed

## smt-key-eth-balance
### Description
Compute smt path of an ethereum address to store its balance

### Params
- `leafType (number)`: leaf type to add to the merkle tree
- `ethAddr (hex string)`: list of objects that defines the addresses to add to the smt and its v
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `expectedKey (string number)`: smt key path computed

## smt-key-eth-nonce
### Description
Compute smt path of an ethereum address to store its nonce

### Params
- `leafType (number)`: leaf type to add to the merkle tree
- `ethAddr (hex string)`: list of objects that defines the addresses to add to the smt and its v
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `expectedKey (string number)`: smt key path computed

## smt-raw
### Description
Add [key-values] to the smt

### Params
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `keys (array[string number])`: list of keys to add to the smt
- `values (array[string number])`: list of values to add to the smt
- `expectedRoot (string number)`: final smt root

## smt-genesis
### Description
Add ethereum address leaves and smart contract bytecode-storage on the smt to create a genesis state

### Params
- `arity (number)`: number of nodes in the smt for each level, 2**arity
- `addresses (array[object])`: list of objevts that defines the addresses to add to the smt and its values
  - `address (hex string)`: ethereum address
  - `balance (string weis)`: initial balance
  - `nonce (string number)`: initial nonce
  - `bytecode (string hex)`: smart contract bytecode
  - `storage (Object [key-value] [String number - String number])`: storage positions and its values
- `expectedRoot (string number)`: final smt root once addresses are added