# save time
start_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "start: $start_date" > times-eth.txt
start_time=$(date +%s)
# clone ethereum/tests
if [ -d "tests" ]
    then
    if [ "$1" == "update" ]
        then
        rm -rf tests
        rm -r eth-inputs
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
clone_time=$(date +%s)
echo -e "git clone time: $((clone_time - start_time))" >> times-eth.txt
dir=./tests/BlockchainTests/GeneralStateTests
# dir=./tests/BlockchainTests
# generate inputs from /tests/BlockchainTests/GeneralStateTests
# for entry in "$dir"/*
# do
    group="GeneralStateTests"
    gen_input_time=$clone_time
    mkdir eth-inputs
    mkdir eth-inputs/$group
    for entry2 in "$dir"/*
    do
        folder=$(echo $entry2 | cut -d '/' -f 5)
        echo $entry2
        if [ -f "eth-inputs/$group/$folder/info.txt" ] && [ "$1" != "update" ]
        then
            echo "Exist"
        else
            mkdir eth-inputs/$group/$folder
            npx mocha --max-old-space-size=12000 gen-inputs.js --group $group --folder $folder > eth-inputs/$group/$folder/all-info.txt
        fi
        gen_input_time_aux=$gen_input_time
        gen_input_time=$(date +%s)
        echo -e "gen inputs $folder: $((gen_input_time - gen_input_time_aux))" >> times-eth.txt
    done
# done
gen_inputs_time=$(date +%s)
echo -e "gen inputs time: $((gen_inputs_time - clone_time))" >> times-eth.txt
# pass tests
cd ../../../zkevm-proverjs
rm cache-main-pil.json
cd tools/run-test
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
                    node --max-old-space-size=12000 run-inputs.js -f $entry2 -r ../../../zkevm-rom/build/rom.json --info $entry2/info-inputs.txt --output $entry2/info-output.txt --ignore > $entry2/all-info-2.txt
                    pass_folder_time_aux=$pass_folder_time
                    pass_folder_time=$(date +%s)
                    echo -e "pass folder $entry2: $((pass_folder_time - pass_folder_time_aux))" >> ../../../zkevm-testvectors/tools/ethereum-tests/times-eth.txt
                fi
            fi
        done
    fi
done
# pass 30M tests
cd ../../../zkevm-testvectors/tools/ethereum-tests/test-tools
node run-tests-30M.js -l ../eth-inputs/GeneralStateTests/tests-30M/tests30M-list.json -r ../../../../zkevm-rom -p ../../../../zkevm-proverjs > ../eth-inputs/GeneralStateTests/tests-30M/all-info.txt

# pass OOC tests
node run-tests-OOC.js -l ../eth-inputs/GeneralStateTests/tests-OOC/testsOOC-list.json -p ../../../../zkevm-proverjs -r ../../../../zkevm-rom > ../eth-inputs/GeneralStateTests/tests-OOC/all-info.txt

cd ../
pass_inputs_time=$(date +%s)
echo -e "pass inputs time: $((pass_inputs_time - gen_inputs_time))" >> times-eth.txt
end_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "end: $end_date" >> times-eth.txt
./eth-tests-get-info.sh