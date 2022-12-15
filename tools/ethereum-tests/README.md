# How to run ethereum tests?
## Requirements
- node `v14.17.0`
- npm `7.13.0`
> https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

## Repositories
- `zkevm-testvectors`: https://github.com/0xPolygonHermez/zkevm-testvectors
    - This repository aims to provide test vectors for polygon-hermez zkevm implementation
- `zkevm-rom`: https://github.com/0xPolygonHermez/zkevm-rom
    - This repository contains the zkasm source code of the polygon-hermez zkevm
- `zkevm-proverjs`: https://github.com/0xPolygonHermez/zkevm-proverjs
    - branch: specified in the package.json of `zkevm-rom`
    - zkEVM proof generator reference written in Javascript

## Steps
Final structure:
```
zkevm
  |--- zkevm-proverjs
  |--- zkevm-rom
  |--- zkevm-testvectors
```
### 1. Create folder:
```
$ mkdir zkevm
$ cd zkevm
 ```

### 2. Clone repositories & install:
Clone `zkevm-testvectors` and install dependencies:
- `zkevm-testvectors`:
```
# After -b option, the version of the repo can be chosen

$ git clone -b v0.5.1.0 git@github.com:0xPolygonHermez/zkevm-testvectors.git
$ cd zkevm-testvectors
$ npm i
$ cd ..
```

**Option 1:**

```
$ ./setup-all.sh
```

> The following option follow the steps of this script

**Option 2:**

Clone `zkevm-rom`, install dependencies and build:
- `zkevm-rom`:
```
# After -b option, the version of the repo can be chosen

$ git clone -b v0.5.2.0 git@github.com:0xPolygonHermez/zkevm-rom.git
$ cd zkevm-rom
$ npm i
$ npm run build
$ grep @0xpolygonhermez/zkevm-proverjs package.json | awk  -F \# '{print substr($2,0,40)}'

# This command will show us the version of zkevm-proverjs
> 1252c73125b24f28f38bbe7075895aa0a2a12eb9

$ cd ..
```
Clone `zkevm-proverjs` and install dependencies:
- `zkevm-proverjs`:
```
$ git clone git@github.com:0xPolygonHermez/zkevm-proverjs.git
$ cd zkevm-proverjs
$ git checkout 1252c73125b24f28f38bbe7075895aa0a2a12eb9
$ npm i
$ cd ..
```

Clone ethereum/tests:
```
$ cd zkevm-testvectors/tools/ethereum-tests
$ ./setup.sh
```

### 3. Generate all inputs and pass tests:
```
# zkevm-testvectors/tools/ethereum-tests

$ ./eth-tests.sh
```
> It is possible to add the `update` option to update the `tests` folder (`ethereum/tests`)
> `./eth-tests.sh update`

At the end of generating and passing all the tests, a summary of the information will be displayed:
```
Commit ethereum/tests: c896d1eabd9719c6bd80b979567573c7ec111429 
Commit zkevm-testvectors: 8f9763ae110a226a79ec0a95c40cc2245067f92b 
Commit zkevm-rom: 00f0421cb61e64da14f800030ddd663e7d9e665a 
Commit zkevm-proverjs: a049538a517e73fecebdf94eafa435e545d2a688 
Files: 2607 
Total tests: 13282 
Generation errors: 8 
Inputs: 9665 
Inputs ok: 9662 
Exec errors: 3 
Not supported: 3609 
----------------------------- 
Tests: 100% 
Tests ok: 73% 
Exec Error: 0% 
Generation Error: 0% 
Not supported: 27%  
Coverage: 99.88%
```

> IMPORTANT: this information will only be correct if all the tests have been passed, it will be incomplete if only some folders have been generated

To get the updated table:
```
$ node gen-table.js
```
> IMPORTANT: the table can only be generated if all the tests have been passed, it will not be generated correctly if only some folders have been passed

### 4. Check information:
Following the previous steps, some files will have been generated:
- `zkevm-testvectors/tools/ethereum-tests/eth-inputs`:
    - `final-info.txt`: All detailed information by folders
    - `final.txt`: summary of all information
    - `final-table.txt`: table resulting from passing all the tests
    - `GeneralStateTests`: all generated inputs, organized in folders like in `ethereum/tests`
        - for each folder:
            - inputs (`.json`)
            - `info.txt`: summary of all information
            - `info-inputs.txt`: inputs generation summary
            - `info-output.txt`: Information resulting from passing the tests

## Quick-guide

```
$ mkdir zkevm
$ cd zkevm
$ git clone -b v0.5.1.0 git@github.com:0xPolygonHermez/zkevm-testvectors.git
$ cd zkevm-testvectors
$ npm i
$ cd ..
$ ./setup-all.sh
$ ./eth-tests.sh
$ node gen-table.js
```

### Extra

#### Generate 1 folder inputs and pass tests

This option is designed for, after generating and passing all the tests following the previous steps, to be able to update a folder without passing all the tests again.

```
# zkevm-testvectors/tools/ethereum-tests

$ ./eth-tests-folder.sh stSLoadTest
```
> It is possible to add the `update` option to update the `tests` folder (`ethereum/tests`)
> `./eth-tests-folder.sh stSLoadTest update`

It is possible to generate and view the information summary again with:
```
$ ./eth-tests-get-info.sh
```

And update table with:
```
$ node gen-table.js
```

#### File `cache-main-pil.json`
This file is created if it does not already exist. It is important to regenerate it in case there is a change of versions.
Depending on the scenario used:
- The above scripts are set up to be regenerated at the beginning of execution.
- If the `run-inputs` file is used directly, the file can be updated with the `--pil` option.
- If the `zkevm-proverjs/src/main_executor.js` file is used directly, the file will not be updated if you use the `--skip` option.

# Information

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