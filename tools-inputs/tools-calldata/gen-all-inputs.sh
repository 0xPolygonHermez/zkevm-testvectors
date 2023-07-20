search_dir=../data/calldata
for entry in "$search_dir"/*
do
  npx mocha --max-old-space-size=4096 ../generators/calldata-gen-inputs.js --vectors ${entry##*/} --update --output
done
