npx mocha gen-test-vectors-evm.js --update
npx mocha gen-inputs.js --update
npx mocha st-all.test.js --update
# npx mocha gen-inputs-eth.js
npx mocha gen-forced-tx.js