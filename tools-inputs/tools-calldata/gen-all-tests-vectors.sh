search_dir=./generate-test-vectors
for entry in "$search_dir"/*
do
  npx mocha --max-old-space-size=4096 gen-test-vectors-evm.js --vectors ${entry##*/}
done
