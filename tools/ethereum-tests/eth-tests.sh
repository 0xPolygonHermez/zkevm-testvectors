if [ -d "tests" ]
    then
    if [ "$1" == "update" ]
        then
        rm -rf tests
        git clone https://github.com/ethereum/tests.git
    fi
else
    git clone https://github.com/ethereum/tests.git
fi

dir=./tests/BlockchainTests

# generate inputs from /tests/BlockchainTests
for entry in "$dir"/*
do
    group=$(echo $entry | cut -d '/' -f 4)
    for entry2 in "$entry"/*
    do
        folder=$(echo $entry2 | cut -d '/' -f 5)
        npx mocha gen-inputs.js --group $group --folder $folder
    done
done

# pass tests
cd ../../../zkevm-proverjs/tools/run-test
dir=../../../zkevm-testvectors/tools/ethereum-tests/eth-inputs
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        node run-inputs.js -f $entry -r ../../../zkevm-rom/build/rom.json --info $entry/info-inputs.txt
    fi
done

# get info
cd ../../../zkevm-testvectors/tools/ethereum-tests
inputs2=0
ok=0
err_exec=0
files=0
tests=0
inputs=0
err_gen=0
dir=./eth-inputs
for entry in "$dir"/*
do
    if [ -f $entry/info-inputs.txt ]
    then
        inputs2=$( expr $inputs2 + $(cat $entry/info-inputs.txt | awk 'FNR == 1 {print $2}'))
        ok=$( expr $ok + $(cat $entry/info-inputs.txt | awk 'FNR == 2 {print $2}'))
        err_exec=$( expr $err_exec + $(cat $entry/info-inputs.txt | awk 'FNR == 3 {print $2}'))
    fi
    for entry2 in "$entry"/*
    do
        if [ -d $entry2 ] && [ -f $entry2/info.txt ]
        then
            files=$( expr $files + $(cat $entry2/info.txt | awk 'FNR == 1 {print $2}') )
            tests=$( expr $tests + $(cat $entry2/info.txt | awk 'FNR == 2 {print $2}') )
            inputs=$( expr $inputs + $(cat $entry2/info.txt | awk 'FNR == 3 {print $2}') )
            err_gen=$( expr $err_gen + $(cat $entry2/info.txt | awk 'FNR == 4 {print $2}') )
        fi
    done
done

let p1=(100*$err_gen+$tests/2)/$tests
let p2=(100*$err_exec+$tests/2)/$tests
let p3=(100*$ok+$tests/2)/$tests

echo -e "Files: $files \nTotal tests: $tests \nGeneration errors: $err_gen \nInputs: $inputs \nInputs ok: $ok \nExec errors: $err_exec \n----------------------------- \nTests: 100% \nTests ok: $p3% \nExec Error: $p2% \nGeneration Error: $p1%" > eth-inputs/final.txt
cat eth-inputs/final.txt
