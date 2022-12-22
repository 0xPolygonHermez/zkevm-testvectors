if [ -d "tests" ]
    then
    if [ "$1" == "update" ]
        then
        rm -rf tests
        rm -r eth-inputs
        git clone https://github.com/ethereum/tests.git
        cd tests
        git checkout 9e0a5e00981575de017013b635d54891f9e561ef
        cd ../
    fi
else
    git clone https://github.com/ethereum/tests.git
    cd tests
    git checkout 9e0a5e00981575de017013b635d54891f9e561ef
    cd ../
fi
dir=./GeneralStateTests
for entry in "$dir"/*
do
    if [ -d $entry ]
    then
        folder=$(echo $entry | cut -d '/' -f 3)
        npx --max-old-space-size=12000 mocha --timeout 0 gen-inputs.js --folder $folder
    fi
done