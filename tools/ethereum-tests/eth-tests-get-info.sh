# get info
cd ../../../zkevm-testvectors/tools/ethereum-tests
echo -e "Tests info: \n" > eth-inputs/final-info.txt
files=0
tests=0
inputs=0
ok=0
err_exec=0
err_gen=0
dir=./eth-inputs
for entry in "$dir"/*
do
    for entry2 in "$entry"/*
    do
        if [ -d $entry2 ] && [ -f $entry2/info.txt ] && [ -f $entry2/info-inputs.txt ]
        then
            files2=$(cat $entry2/info.txt | awk 'FNR == 1 {print $2}')
            tests2=$(cat $entry2/info.txt | awk 'FNR == 2 {print $2}')
            inputs2=$(cat $entry2/info.txt | awk 'FNR == 3 {print $2}')
            err_gen2=$(cat $entry2/info.txt | awk 'FNR == 4 {print $2}')
            ok2=$(cat $entry2/info-inputs.txt | awk 'FNR == 2 {print $2}')
            err_exec2=$(cat $entry2/info-inputs.txt | awk 'FNR == 3 {print $2}')
            let err_gen_perc=(100*$err_gen2+$tests2/2)/$tests2
            let err_exec_perc=(100*$err_exec2+$tests2/2)/$tests2
            let ok_perc=(100*$ok2+$tests2/2)/$tests2
            echo -e "Test $entry2" >> eth-inputs/final-info.txt
            echo -e "Files: $files2" >> eth-inputs/final-info.txt
            echo -e "Tests: $tests2" >> eth-inputs/final-info.txt
            echo -e "Inputs: $inputs2" >> eth-inputs/final-info.txt
            echo -e "Generation errors: $err_gen2" >> eth-inputs/final-info.txt
            echo -e "Inputs ok: $ok2" >> eth-inputs/final-info.txt
            echo -e "Execution errors: $err_exec2" >> eth-inputs/final-info.txt
            echo -e "% pass correctly: $ok_perc%" >> eth-inputs/final-info.txt
            echo -e "% generation errors: $err_gen_perc%" >> eth-inputs/final-info.txt
            echo -e "% execution errors: $err_exec_perc%" >> eth-inputs/final-info.txt
            echo -e "_______________________________________________________________________________\n" >> eth-inputs/final-info.txt
            ok=$( expr $ok + $ok2 )
            files=$( expr $files + $files2 )
            tests=$( expr $tests + $tests2 )
            inputs=$( expr $inputs + $inputs2 )
            err_gen=$( expr $err_gen + $err_gen2 )
            err_exec=$( expr $err_exec + $err_exec2 )
        else
            if [ -d $entry2 ]
            then
                echo -e "Test $entry2" >> eth-inputs/final-info.txt
                echo -e "ERROR ****************************" >> eth-inputs/final-info.txt
                echo -e "_______________________________________________________________________________\n" >> eth-inputs/final-info.txt
            fi
        fi
    done
done

let p1=(100*$err_gen+$tests/2)/$tests
let p2=(100*$err_exec+$tests/2)/$tests
let p3=(100*$ok+$tests/2)/$tests

echo -e "Files: $files \nTotal tests: $tests \nGeneration errors: $err_gen \nInputs: $inputs \nInputs ok: $ok \nExec errors: $err_exec \n----------------------------- \nTests: 100% \nTests ok: $p3% \nExec Error: $p2% \nGeneration Error: $p1%" > eth-inputs/final.txt
cat eth-inputs/final.txt
