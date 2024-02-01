# Regen tests
node tools-inputs/helpers/vcounters-removal.js
npm run update:smt
npm run update:mt:bridge
npm run update:st:calldata
npm run update:st:no-data
npm run update:e2e
npm run update:error-rlp
npm run update:calldata-custom
npm run update:forcedtx
npm run update:stateoverride
npm run update:eth-tests

## Custom tests
## inputs-executor/calldata/custom-tx_X.json
## ethereum-tests/GeneralStateTests/stEIP4758/sendallBasic.json
## ethereum-tests/GeneralStateTests/stEIP4758/sendallToSelf.json

## Tests that may need to compute te newStateRoot
### inputs-executor/rlp-error
### inputs-executor/custom-generated
