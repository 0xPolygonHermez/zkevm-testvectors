rm ./inputs-executor/ethereum-tests/GeneralStateTests/tests-30M/tests30M-list.json-ignore
mv ./inputs-executor/ethereum-tests/GeneralStateTests/tests-OOC/testsOOC-list.json-ignore ./inputs-executor/ethereum-tests/GeneralStateTests/tests-OOC/testsOOC-list.json
if [ -d "tests" ]
    then
    if [ "$1" == "update" ]
        then
        rm -rf tests
        rm -r eth-inputs
        git clone https://github.com/0xPolygonHermez/ethereum-tests tests
        cd tests
        git checkout test-vectors
        cd ../
    fi
else
    git clone https://github.com/0xPolygonHermez/ethereum-tests tests
    cd tests
    git checkout test-vectors
    cd ../
fi
dir=./tests/BlockchainTests/GeneralStateTests
for entry in $dir/*
do
    echo $entry
    if [ -d $entry ]
    then
        folder=$(echo $entry | cut -d '/' -f 5)
        npx --max-old-space-size=12000 mocha --timeout 0 ../generators/eth-gen-inputs.js --folder $folder &
    fi
done
wait
mv ./inputs-executor/ethereum-tests/GeneralStateTests/tests-30M/tests30M-list.json ./inputs-executor/ethereum-tests/GeneralStateTests/tests-30M/tests30M-list.json-ignore
mv ./inputs-executor/ethereum-tests/GeneralStateTests/tests-OOC/testsOOC-list.json ./inputs-executor/ethereum-tests/GeneralStateTests/tests-OOC/testsOOC-list.json-ignore
npx --max-old-space-size=12000 mocha ../generators/eth-gen-inputs-legacy.js --folder stTransactionTest
npx --max-old-space-size=12000 mocha ../generators/eth-gen-inputs-legacy.js --folder stMemoryTest