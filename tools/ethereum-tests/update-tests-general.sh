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
dir=./GeneralStateTests
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        folder=$(echo $entry | cut -d '/' -f 3)
        npx --max-old-space-size=12000 mocha gen-inputs.js --folder $folder
    fi
done