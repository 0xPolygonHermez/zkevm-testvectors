search_dir=../../../test-vector-data
for entry in "$search_dir"/*
do
  npx mocha gen-inputs.js --vectors ${entry##*/} --update
done
