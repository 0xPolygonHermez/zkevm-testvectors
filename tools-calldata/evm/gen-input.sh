# example: ./gen-input.sh gen-test-contracts
file=$1
npx mocha gen-test-vectors-evm.js --vectors $file
file2=${file#*-}
npx mocha gen-inputs.js --vectors $file2 --update --output --evm-debug