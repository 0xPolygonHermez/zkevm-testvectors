# Generate new test-vectors or inputs
1. Add or modify `generate-test-vectors` file --> example: `gen-example.json`
2. Run `npx mocha gen-test-vectors-evm.js --vectors gen-example.json` --> output: `test-vectors/test-vector-data/example.json`
3. Run `npx mocha gen-inputs.js --vectors example --update` --> output: `test-vectors/inputs-executor/inputs/input_example_X.json` (one `input` for each id in `test-vector-data`)

Or it is possible to do the steps for all files with: `./gen-all.sh`
Or just step 2 for all files with: `.gen-all-tests-vectors.sh`
Or just step 3 for all files with: `.gen-all-inputs.sh`

To generate a debug file for bytecode execution and stack traces, add the --evm-debug flag.
`npx mocha gen-inputs.js --vectors example --evm-debug`