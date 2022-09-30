start_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "start: $start_date" > times-eth.txt
start_time=$(date +%s)
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
clone_time=$(date +%s)
echo -e "git clone time: $((clone_time - start_time))" >> times-eth.txt
dir=./tests/BlockchainTests/GeneralStateTests
# dir=./tests/BlockchainTests
# generate inputs from /tests/BlockchainTests/GeneralStateTests
# for entry in "$dir"/*
# do
    group="GeneralStateTests"
    gen_input_time=$clone_time
    for entry2 in "$dir"/*
    do
        folder=$(echo $entry2 | cut -d '/' -f 5)
        echo $entry2
        if [ -f "eth-inputs/$group/$folder/info.txt" ] && [ "$1" != "update" ]
        then
            echo "Exist"
        else
            npx mocha --max-old-space-size=12000 gen-inputs.js --group $group --folder $folder --output eth-inputs
        fi
        gen_input_time_aux=$gen_input_time
        gen_input_time=$(date +%s)
        echo -e "gen inputs $folder: $((gen_input_time - gen_input_time_aux))" >> times-eth.txt
    done
# done
gen_inputs_time=$(date +%s)
echo -e "gen inputs time: $((gen_inputs_time - clone_time))" >> times-eth.txt
# pass tests
cd ../../../zkevm-proverjs/tools/run-test
dir=../../../zkevm-testvectors/tools/ethereum-tests/eth-inputs
pass_folder_time=$gen_inputs_time
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
                    node --max-old-space-size=12000 run-inputs.js -f $entry2 -r ../../../zkevm-rom/build/rom.json --info $entry2/info-inputs.txt --output $entry2/info-output.txt
                    pass_folder_time_aux=$pass_folder_time
                    pass_folder_time=$(date +%s)
                    echo -e "pass folder $entry2: $((pass_folder_time - pass_folder_time_aux))" >> ../../../zkevm-testvectors/tools/ethereum-tests/times-eth.txt
                fi
            fi
        done
    fi
done
cd ../../../zkevm-testvectors/tools/ethereum-tests
pass_inputs_time=$(date +%s)
echo -e "pass inputs time: $((pass_inputs_time - gen_inputs_time))" >> times-eth.txt
end_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "end: $end_date" >> times-eth.txt
./eth-tests-get-info.sh