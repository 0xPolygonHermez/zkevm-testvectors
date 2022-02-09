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

## smt-key
### Description
Compute smt path depending on leaf type

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