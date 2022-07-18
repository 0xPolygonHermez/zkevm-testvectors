if [ -d "tests" ]
    then
    if [ "$1" == "update" ]
        then
        rm -rf tests
        rm -r eth-inputs
        git clone https://github.com/ethereum/tests.git
    fi
else
    git clone https://github.com/ethereum/tests.git
fi

dir=./tests/BlockchainTests/GeneralStateTests
# dir=./tests/BlockchainTests
# generate inputs from /tests/BlockchainTests/GeneralStateTests
# for entry in "$dir"/*
# do
    group="GeneralStateTests"
    for entry2 in "$dir"/*
    do
        folder=$(echo $entry2 | cut -d '/' -f 5)
        echo $entry2
        if [ -f "eth-inputs/$group/$folder/info.txt" ] && [ "$1" != "update" ]
        then
            echo "Exist"
        else
            npx mocha gen-inputs.js --group $group --folder $folder --output eth-inputs --max-old-space-size=4096
        fi
    done
# done

# pass tests
cd ../../../zkevm-proverjs/tools/run-test
dir=../../../zkevm-testvectors/tools/ethereum-tests/eth-inputs
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        for entry2 in "$entry"/*
        do
            if [ -d $entry2 ]
            then
                if [ -f "$entry2/info.txt" ]
                then
                    node run-inputs.js -f $entry2 -r ../../../zkevm-rom/build/rom.json --info $entry2/info-inputs.txt --output $entry2/info-output.txt --max-old-space-size=4096
                fi
            fi
        done
    fi
done

cd ../../../zkevm-testvectors/tools/ethereum-tests
./eth-tests-get-info.sh