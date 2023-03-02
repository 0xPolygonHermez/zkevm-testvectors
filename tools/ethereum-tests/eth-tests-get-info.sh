# get info
cd ../../../zkevm-testvectors/tools/ethereum-tests
echo -e "Tests info: \n" > eth-inputs/final-info.txt
commit_testvectors=$(git rev-parse HEAD)
cd ../../../zkevm-proverjs
commit_proverjs=$(git rev-parse HEAD)
cd ../zkevm-rom
commit_rom=$(git rev-parse HEAD)
cd ../zkevm-testvectors/tools/ethereum-tests/tests
commit_eth_tests=$(git rev-parse HEAD)
cd ../
echo -e "Commit zkevm-testvectors: $commit_testvectors" >> eth-inputs/final-info.txt
echo -e "Commit zkevm-rom: $commit_rom" >> eth-inputs/final-info.txt
echo -e "Commit zkevm-proverjs: $commit_proverjs\n" >> eth-inputs/final-info.txt

node eth-tests-get-info.js --commit_eth_tests $commit_eth_tests  --commit_testvectors $commit_testvectors --commit_rom $commit_rom --commit_proverjs $commit_proverjs
cat eth-inputs/final.txt
