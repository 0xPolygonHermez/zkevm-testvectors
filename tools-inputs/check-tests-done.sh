start_date="$(date +%T) $(date +%d/%m/%y)"
echo -e "start: $start_date" > times.txt
pwd
start_time=$(date +%s)
# pass tests
cd ../../zkevm-proverjs
# rm cache-main-pil.json
cd tools/run-test
dir=../../../zkevm-testvectors/inputs-executor
count=0
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        for entry2 in "$entry"/*
        do
            if [ -d $entry2 ]
            then
                count=$((count + 1))
                node --max-old-space-size=8192 run-inputs.js -f $entry2 -r ../../../zkevm-rom/build/rom.json --output ../../../zkevm-testvectors/inputs-executor/info-output-$count.txt
            fi
        done
        count=$((count + 1))
        node --max-old-space-size=8192 run-inputs.js -f $entry -r ../../../zkevm-rom/build/rom.json --output ../../../zkevm-testvectors/inputs-executor/info-output-$count.txt
    fi
done
end_time="$(date +%T)"
echo -e "end: $end_time" >> times.txt