start_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "start: $start_date" > times.txt
start_time=$(date +%s)
# pass tests
cd ../../../zkevm-proverjs/tools/run-test
dir=../../../zkevm-testvectors/inputs-executor
count=0
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        count=$((count + 1))
        node --max-old-space-size=4096 run-inputs.js -f $entry -r ../../../zkevm-rom/build/rom.json --output ../../../zkevm-testvectors/tools/ethereum-tests/info-output-$count.txt
    fi
done
pass_folder_time=$(date +%s)
echo -e "pass inputs from $dir: $((pass_folder_time - start_time))" >> ../../../zkevm-testvectors/tools/ethereum-tests/times.txt
dir=../../../zkevm-testvectors/tools/ethereum-tests/GeneralStateTests
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        count=$((count + 1))
        node --max-old-space-size=4096 run-inputs.js -f $entry -r ../../../zkevm-rom/build/rom.json --output ../../../zkevm-testvectors/tools/ethereum-tests/info-output-$count.txt
    fi
done
cd ../../../zkevm-testvectors/tools/ethereum-tests
pass_inputs_time_2=$(date +%s)
echo -e "pass inputs from $dir: $((pass_inputs_time_2 - pass_folder_time))" >> times.txt
end_time="$(date +%T)"
echo -e "end: $end_time" >> times.txt