# Regen calldata tests
npm run update:smt && npm run update:mt:bridge && npm run update:st:calldata && npm run update:st:no-data && npm run update:e2e && npm run update:error-rlp

# Regen ethereum tests
dir=./tools/ethereum-tests/GeneralStateTests
for entry in "$dir"/*
do
    if [ -d $entry ]; then
        folder=${entry##*/}
        if [[ "$folder" == *"-legacy"* ]]; then
            folder=${folder%"-legacy"}
            npx mocha --max-old-space-size=8000 tools/ethereum-tests/gen-inputs-legacy.js --evm-debug --folder $folder --output GeneralStateTests
        else
            npx mocha --max-old-space-size=8000 tools/ethereum-tests/gen-inputs.js --evm-debug --folder $folder
        fi
    fi
done
