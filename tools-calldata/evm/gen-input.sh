# example: ./gen-input.sh gen-test-contracts
file=$1
npx mocha --max-old-space-size=4096 gen-test-vectors-evm.js --vectors $file
file2=${file#*-}
npx mocha --max-old-space-size=4096 gen-inputs.js --vectors $file2 --update --output --evm-debug