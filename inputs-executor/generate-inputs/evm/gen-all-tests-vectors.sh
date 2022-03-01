search_dir=./generate-test-vectors
for entry in "$search_dir"/*
do
  npx mocha gen-test-vectors-evm.js --vectors ${entry##*/}
done
