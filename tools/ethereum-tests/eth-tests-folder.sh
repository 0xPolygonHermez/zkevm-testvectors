if [ -d "tests" ]
    then
    if [ "$2" == "update" ]
        then
        rm -rf tests
        git clone https://github.com/ethereum/tests.git
        cd tests
        git checkout 9e0a5e00981575de017013b635d54891f9e561ef
        cd ../
    fi
else
    git clone https://github.com/ethereum/tests.git
    cd tests
    git checkout 9e0a5e00981575de017013b635d54891f9e561ef
    cd ../
fi

# gen tests
dir=./tests/BlockchainTests/GeneralStateTests
group="GeneralStateTests"
folder=$1


rm -rf eth-inputs/$group/$folder

npx mocha --max-old-space-size=12000 gen-inputs.js --group $group --folder $folder --output eth-inputs

# pass tests
cd ../../../zkevm-proverjs
rm cache-main-pil.json
cd tools/run-test
dir=../../../zkevm-testvectors/tools/ethereum-tests/eth-inputs/$group/$folder
node --max-old-space-size=12000 run-inputs.js -f $dir -r ../../../zkevm-rom/build/rom.json --info $dir/info-inputs.txt --output $dir/info-output.txt --ignore

cd ../../../zkevm-testvectors/tools/ethereum-tests