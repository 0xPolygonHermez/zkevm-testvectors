rm ./GeneralStateTests/tests-30M/tests30M-list.json-ignore
mv ./GeneralStateTests/tests-OOC/testsOOC-list.json-ignore ./GeneralStateTests/tests-OOC/testsOOC-list.json
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
dir=./GeneralStateTests
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        folder=$(echo $entry | cut -d '/' -f 3)
        npx --max-old-space-size=12000 mocha --timeout 0 gen-inputs.js --folder $folder
    fi
done
mv ./GeneralStateTests/tests-30M/tests30M-list.json ./GeneralStateTests/tests-30M/tests30M-list.json-ignore
mv ./GeneralStateTests/tests-OOC/testsOOC-list.json ./GeneralStateTests/tests-OOC/testsOOC-list.json-ignore
npx --max-old-space-size=12000 mocha gen-inputs-legacy.js --folder stTransactionTest
npx --max-old-space-size=12000 mocha gen-inputs-legacy.js --folder stMemoryTest