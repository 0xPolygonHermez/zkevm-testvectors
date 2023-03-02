dir=../eth-inputs
echo -e "# Execution errors \n" > ../eth-inputs/exec-err.txt
echo -e "| Folder Name | Test Name |" >> ../eth-inputs/exec-err.txt
echo -e "|:-----------:| --------- |" >> ../eth-inputs/exec-err.txt
for entry in "$dir"/*
do
    for entry2 in "$entry"/*
    do
        for entry3 in "$entry2"/*
        do
            if [[ $entry3 == *"-ignore"* ]]
            then
                folder=$(echo $entry3 | cut -d '/' -f 4)
                test=$(echo $entry3 | cut -d '/' -f 5)
                echo -e "| $folder | $test |" >> ../eth-inputs/exec-err.txt
            fi
        done
    done
done
