search_dir=../../state-transition/calldata
for entry in "$search_dir"/*
do
  npx mocha gen-inputs.js --vectors ${entry##*/} --update --output
done
