search_dir=../../state-transition/calldata
for entry in "$search_dir"/*
do
  npx mocha --max-old-space-size=4096 gen-inputs.js --vectors ${entry##*/} --update --output
done
