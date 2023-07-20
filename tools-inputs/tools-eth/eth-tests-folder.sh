if [ -d "tests" ]
    then
    if [ "$2" == "update" ]
        then
        rm -rf tests
        git clone https://github.com/0xPolygonHermez/ethereum-tests.git
        cd ethereum-tests
        git checkout test-vectors
        cd ../
    fi
else
    git clone https://github.com/0xPolygonHermez/ethereum-tests.git
    cd ethereum-tests
    git checkout test-vectors
    cd ../
fi

# gen tests
dir=./tests/BlockchainTests/GeneralStateTests
group="GeneralStateTests"
folder=$1

rm -rf eth-inputs/$group/$folder

npx mocha --max-old-space-size=12000 ../generators/eth-gen-inputs.js --group $group --folder $folder --output eth-inputs -n ../../../zkevm-testvectors/tools-inputs/tools-eth/no-exec.json

# pass tests
cd ../../../zkevm-proverjs
rm cache-main-pil.json
cd tools/run-test
dir=../../../zkevm-testvectors/tools-inputs/tools-eth/eth-inputs/$group/$folder
node --max-old-space-size=12000 run-inputs.js -f $dir -r ../../../zkevm-rom/build/rom.json --info $dir/info-inputs.txt --output $dir/info-output.txt --ignore

cd ../../../zkevm-testvectors/tools-inputs/tools-eth