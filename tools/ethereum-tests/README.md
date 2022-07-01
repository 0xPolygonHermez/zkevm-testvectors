## Information

Each folder corresponds to a folder inside `ethereum/tests` repository.

To create the input and check that it is correct, two files from that repository are used:

- First file: `tests/BlockchainTests/{directoryTests}/{typeTests}/{file}.json`
- Second file: `tests/src/{directoryTests}Filler/{typeTests}/{file}Filler.json`

These two files contain all the necessary information for each test.

## Usage

First step: clone `ethereum/tests` repository:
```
./setup.sh
```
Then, inside each folder:

- Create all the inputs of that folder:
```
npx mocha gen-inputs.js
```

- Create one input:
```
npx mocha gen-inputs.js --test stChainId/chainId.json
```

- Create all the inputs of a folder inside the initial folder:
```
npx mocha gen-inputs.js --folder stChainId
```

- Flag to generate `evm-stack-logs`: `--evm-debug`
- Flat to write output (executor input) with `-ignore`: `--ig` -->  test.json-ignore

## Inputs
- If and input does not pass correctly, it ends with `-ignore`
- Each folder has a file `errors`: this document contains which inputs HAVE NOT BEEN GENERATED correctly with the `gen-inputs` script