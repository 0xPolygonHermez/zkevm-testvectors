if [ -d "tests" ]
    then
    if [ "$2" == "update" ]
        then
        rm -rf tests
        git clone https://github.com/ethereum/tests.git
    fi
else
    git clone https://github.com/ethereum/tests.git
fi

# gen tests
dir=./tests/BlockchainTests/GeneralStateTests
group="GeneralStateTests"
folder=$1

npx mocha gen-inputs.js --group $group --folder $folder --output eth-inputs

# pass tests
cd ../../../zkevm-proverjs/tools/run-test
dir=../../../zkevm-testvectors/tools/ethereum-tests/eth-inputs/$group/$folder

node --max-old-space-size=4096 run-inputs.js -f $dir -r ../../../zkevm-rom/build/rom.json --info $dir/info-inputs.txt --output $dir/info-output.txt

cd ../../../zkevm-testvectors/tools/ethereum-tests
./eth-tests-get-info.sh