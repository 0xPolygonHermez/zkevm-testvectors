dir=./eth-inputs
aux="false"
count=0
echo -e "# Generation errors \n" > eth-inputs/exec-err-gen.txt
for entry in "$dir"/*
do
    for entry2 in "$entry"/*
    do
        for entry3 in "$entry2"/*
        do
            if [[ $entry3 == *"errors.txt"* ]]
            then
                while read line;
                do
                    if [[ $line == "Error: not supported" ]]
                    then
                        aux="true"
                    elif [[ $line == "no Berlin keys" ]]
                    then
                        aux="true"
                    elif [[ $line == "--------------------------------------------------" ]]
                    then
                        if [ "$aux" == "true" ]
                        then
                            aux="false"
                        fi
                    elif [[ $aux == "false" ]]
                    then
                        echo -e "$line" >> eth-inputs/exec-err-gen.txt
                        if [[ $line == *".json"* ]]
                        then
                            count=$((count+1))
                            echo -e "$count $entry2" >> eth-inputs/exec-err-gen.txt
                            echo -e "--------------------------------------------------" >> eth-inputs/exec-err-gen.txt
                        fi
                    fi
                done < $entry3
            fi
        done
    done
done
