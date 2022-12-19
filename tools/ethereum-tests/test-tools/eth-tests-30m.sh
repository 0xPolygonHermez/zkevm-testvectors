npx mocha --max-old-space-size=12000 run-tests-x.js --error 30M

# pass tests
cd ../../../../zkevm-proverjs
rm cache-main-pil.json
cd tools/run-test
dir=../../../zkevm-testvectors/tools/ethereum-tests/tests-30M
node --max-old-space-size=12000 run-inputs.js -f $dir -r ../../../zkevm-rom/build/rom.json --info $dir/info-inputs.txt --output $dir/info-output.txt

cd ../../../zkevm-testvectors/tools/ethereum-tests/test-tools