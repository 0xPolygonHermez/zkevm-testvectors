# mt-bridge

## notes

All the merkle trees will have 32 levels.

## leaf-vectors

### Description

Calculate the leaf value from the leaf parameters
A leaf parameters are defined as:

`leafParameters`:

- `originalNetwork (number)`
- `tokenAddress (hex string)`
- `amount (hex string)`
- `destinationNetwork (number)`
- `destinationAddress (hex string)`

And the `leafValue` is calculated as follows:

- `Keccak256(['uint32', 'address', 'uint256', 'uint32', 'address'], [originalNetwork, tokenAddress, amount, destinationNetwork, destinationAddress]);`

### Params

- `originalNetwork (number)`
- `tokenAddress (hex string)`
- `amount (hex string)`
- `destinationNetwork (number)`
- `destinationAddress (hex string)`
- `leafValue (hex string)`: expected leaf value

## root-vectors

### Description

Given `previousLeafsValues` calculate the current root of the merkle tree as `currentRoot`
Add a new leaf `newLeaf`
Calculate the new root as `newRoot`

### Params

- `previousLeafsValues (Array[hex string])`: Array of leaf values
- `currentRoot (hex string)`: Resulting root of the preivous leaf values
- `newLeaf (leafParameters)`: A new leaf that will be inserted in the merkle tree
- `newRoot (hex string)`: Resulting root after adding the last leaf

## claim-vectors

### Description

Given some leafs and an index calculate the root and the merkle proof

### Params

- `leafs (Array[leafParameters])`: Array of leafs that should be added to the mekrle tree
- `index (number)`: Index of the leaf that will retrieve the merkle proof
- `proof (Array[hex string])`: Merkle proof
- `root (hex string)`: Expected root after adding all the leafs
