#npx mocha --max-old-space-size=12000 run-tests-x.js --error OOC

# pass tests
cd ../../../../zkevm-proverjs
rm cache-main-pil.json
cd tools/run-test
dir=../../../zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/tests-OOC
node --max-old-space-size=12000 run-inputs.js -f $dir -r ../../../zkevm-rom/build/rom.json --info $dir/info-inputs.txt --output $dir/info-output.txt -n ../../../zkevm-testvectors/tools-inputs/tools-eth/no-exec.json

cd ../../../zkevm-testvectors/tools-inputs/tools-eth/test-tools