# Commands

## Generate inputs from ethereum folder

Directory: `./generators`
```
npx mocha eth-gen-inputs.js --folder XXXXXXXXX (--evm-debug)

npx mocha eth-gen-inputs.js --folder stChainId --evm-debug
```
> Optional flag: `--evm-debug` Generate stack logs in `./generators/evm-stack-logs`

## Generate input from ethereum test

Directory: `./generators`
```
npx mocha eth-gen-inputs.js --test XXXXXXXXX (--evm-debug)

npx mocha eth-gen-inputs.js --test stChainId/chainId --evm-debug
```

> Optional flag: `--evm-debug` Generate stack logs in `./generators/evm-stack-logs`

## Generate input from calldata

Directory: `./tools-calldata`
```
./gen-input.sh gen-XXXXXXXXXXXXXX

./gen-input.sh gen-test-contracts
```

## Get information from inputs-exectuor/ethereum-tests

Directory: `tools-eth/test-tools`
```
npx mocha eth-get-info-par.js
```
Generate: `final-table.txt` & `final-table-2.txt`

```
node gen-no-exec.js
```
Generate: `inputs-executor/ethereum-tests/GeneralStateTests/no-exec-all.json`
from `inputs-executor/ethereum-tests/GeneralStateTests/*/no-exec-*.json`

## Regenerate inputs-executor/ethereum-tests & run parallel-tests

1. Delete `zkevm-testvectors-internal/inputs-executor/ethereum-tests/GeneralStateTests` folder
2. Delete `zkevm-testvectors-internal/tools-inputs/tools-eth/tests-parallel/parallel-tests` folder
3. Run `zkevm-testvectors-internal/tools-inputs/tools-eth/eth-tests.sh`
    - Regenerate `zkevm-testvectors-internal/inputs-executor/ethereum-tests/GeneralStateTests`
    - Generate `zkevm-testvectors-internal/tools-inputs/tools-eth/tests-parallel/parallel-tests`
    - Run tests from `zkevm-testvectors-internal/tools-inputs/tools-eth/tests-parallel/parallel-tests`
4. Generate `no-exec-all.json` with `zkevm-testvectors-internal/tools-inputs/tools-eth/test-tools/gen-no-exec.js`
5. Update `zkevm-testvectors-internal/tools-inputs/tools-eth/no-exec.json` with `zkevm-testvectors-internal/inputs-executor/ethereum-tests/GeneralStateTests/no-exec-all.json`