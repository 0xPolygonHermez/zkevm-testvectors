if [ -d "tests" ]
    then
    echo "ethereum/tests exist"
else
    git clone https://github.com/0xPolygonHermez/ethereum-tests tests
    cd tests
    git checkout feature/update-tests-vectors
    cd ../
fi