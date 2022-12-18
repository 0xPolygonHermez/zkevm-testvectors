if [ -d "tests" ]
    then
    echo "ethereum/tests exist"
else
    git clone https://github.com/ethereum/tests.git
    cd tests
    git checkout 9e0a5e00981575de017013b635d54891f9e561ef
    cd ../
fi