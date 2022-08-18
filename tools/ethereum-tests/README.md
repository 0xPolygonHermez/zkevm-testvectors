## Information

Each folder corresponds to a folder inside `ethereum/tests` repository.

To create the input and check that it is correct, two files from that repository are used:

- First file: `tests/BlockchainTests/{directoryTests}/{typeTests}/{file}.json`
- Second file: `tests/src/{directoryTests}Filler/{typeTests}/{file}Filler.json`

These two files contain all the necessary information for each test.

## Options

- `group`: folder inside `BlockhainTests` (default: `GeneralStateTests`)
- `folder`: folder inside `group`
- `test`: path test `${folder}/${test}`
- `output`: path to write inputs, for example: `--output eth-inputs` (default: in this folder)
- Flag to generate `evm-stack-logs`: `--evm-debug`
- Flat to write output (executor input) with `-ignore`: `--ig` -->  test.json-ignore

## Usage

First step: clone `ethereum/tests` repository:
```
./setup.sh
```

- Create one input:
```
npx mocha gen-inputs.js --test stChainId/chainId.json
```

- Create all the inputs of a folder inside the initial folder:
```
npx mocha gen-inputs.js --folder stChainId
```

## Inputs
- If and input does not pass correctly, it ends with `-ignore`
- Each folder has a file `errors`: this document contains which inputs HAVE NOT BEEN GENERATED correctly with the `gen-inputs` script

## Scripts

- `eth-tests.sh update`: generate & pass all tests, without `update` only pass all inputs
- `check-tests-done.sh`: pass all inputs uploaded in this repo (which means they pass correctly)
- `eth-tests-folder.sh stChainId`: generate and pass the tests for a folder
- `eth-tests-get-info.sh`: to collect all the information from the tests

## Further information
### no-exec.json file
This file contains test that are not going to be executed.
- `breaks-computation`: breaks the execution computation due to hardware limitations. Further research must be done on those test to fix them and generate executor inputs properly. They count as errors.
- `not-supported`: not suitable for the zkEVM. They will be added to supported test as long as more features are added to the zkEVM. they count as not-supported and they are not included in the total coverage.