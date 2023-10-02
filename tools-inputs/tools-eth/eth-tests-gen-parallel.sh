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
group="GeneralStateTests"
gen_input_time=$clone_time
for entry2 in "$dir"/*
do
    folder=$(echo $entry2 | cut -d '/' -f 5)
    echo $entry2
    gen_input_time_aux=$(date +%s)
    npx mocha --max-old-space-size=12000 ../generators/eth-gen-inputs.js --group $group --folder $folder > ../../inputs-executor/ethereum-tests/$group/$folder/all-info.txt # &
    gen_input_time_aux_2=$(date +%s)
    echo -e "gen time individual: $((gen_input_time_aux_2 - gen_input_time_aux))" >> times-eth.txt
done
 #wait
gen_inputs_time=$(date +%s)
echo -e "gen inputs time: $((gen_inputs_time - clone_time))" >> times-eth.txt
start_time_gen_paralel=$(date +%s)
echo -e "start: $start_time_gen_paralel" >> times-eth.txt
# pass tests
npm run test:gen
start_time_run=$(date +%s)
echo -e "gen paralel inputs time: $((start_time_run - start_time_gen_paralel))" >> times-eth.txt
echo -e "end gen: $start_time_run" >> times-eth.txts
npm run test:start
end_time=$(date +%s)
echo -e "gen paralel inputs time: $((end_time - start_time_run))" >> times-eth.txt
echo -e "end run: $end_time" >> times-eth.txt