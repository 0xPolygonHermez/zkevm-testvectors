# get info
cd ../../../zkevm-testvectors/tools/ethereum-tests
echo -e "Tests info: \n" > eth-inputs/final-info.txt
commit_testvectors=$(git rev-parse HEAD)
cd ../../../zkevm-proverjs
commit_proverjs=$(git rev-parse HEAD)
cd ../zkevm-rom
commit_rom=$(git rev-parse HEAD)
cd ../zkevm-testvectors/tools/ethereum-tests/tests
commit_eth_tests=$(git rev-parse HEAD)
cd ../
echo -e "Commit zkevm-testvectors: $commit_testvectors" >> eth-inputs/final-info.txt
echo -e "Commit zkevm-rom: $commit_rom" >> eth-inputs/final-info.txt
echo -e "Commit zkevm-proverjs: $commit_proverjs\n" >> eth-inputs/final-info.txt
files=0
tests=0
inputs=0
ok=0
err_exec=0
err_gen=0
not_sup=0
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
            not_sup2=$(cat $entry2/info.txt | awk 'FNR == 5 {print $2}')
            ok2=$(cat $entry2/info-inputs.txt | awk 'FNR == 2 {print $2}')
            err_exec2=$(cat $entry2/info-inputs.txt | awk 'FNR == 3 {print $2}')
            let err_gen_perc=(100*$err_gen2+$tests2/2)/$tests2
            let err_exec_perc=(100*$err_exec2+$tests2/2)/$tests2
            let ok_perc=(100*$ok2+$tests2/2)/$tests2
            let aux=$tests2-$not_sup2
            if [[ $aux == 0 ]]
            then
                let cov_perc=100
            else
                let cov_perc=(100*$ok2+$aux/2)/$aux
            fi
            echo -e "Test $entry2" >> eth-inputs/final-info.txt
            echo -e "Files: $files2" >> eth-inputs/final-info.txt
            echo -e "Tests: $tests2" >> eth-inputs/final-info.txt
            echo -e "Inputs: $inputs2" >> eth-inputs/final-info.txt
            echo -e "Generation errors: $err_gen2" >> eth-inputs/final-info.txt
            echo -e "Inputs ok: $ok2" >> eth-inputs/final-info.txt
            echo -e "Execution errors: $err_exec2" >> eth-inputs/final-info.txt
            echo -e "Not supported: $not_sup2" >> eth-inputs/final-info.txt
            echo -e "% pass correctly: $ok_perc%" >> eth-inputs/final-info.txt
            echo -e "% generation errors: $err_gen_perc%" >> eth-inputs/final-info.txt
            echo -e "% execution errors: $err_exec_perc%" >> eth-inputs/final-info.txt
            echo -e "% coverage: $cov_perc%" >> eth-inputs/final-info.txt
            echo -e "_______________________________________________________________________________\n" >> eth-inputs/final-info.txt
            ok=$( expr $ok + $ok2 )
            files=$( expr $files + $files2 )
            tests=$( expr $tests + $tests2 )
            inputs=$( expr $inputs + $inputs2 )
            err_gen=$( expr $err_gen + $err_gen2 )
            err_exec=$( expr $err_exec + $err_exec2 )
            not_sup=$( expr $not_sup + $not_sup2 )
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
let p4=(100*$not_sup+$tests/2)/$tests
let aux_cov=$tests-$not_sup
let p5=(100*$ok+$aux_cov/2)/$aux_cov

echo -e "Commit ethereum/tests: $commit_eth_tests \nCommit zkevm-testvectors: $commit_testvectors \nCommit zkevm-rom: $commit_rom \nCommit zkevm-proverjs: $commit_proverjs \nFiles: $files \nTotal tests: $tests \nGeneration errors: $err_gen \nInputs: $inputs \nInputs ok: $ok \nExec errors: $err_exec \nNot supported: $not_sup \n----------------------------- \nTests: 100% \nTests ok: $p3% \nExec Error: $p2% \nGeneration Error: $p1% \nNot supported: $p4%  \nCoverage: $p5%" > eth-inputs/final.txt
cat eth-inputs/final.txt
