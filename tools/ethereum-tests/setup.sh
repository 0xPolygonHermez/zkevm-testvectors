if [ -d "/tests" ]
    then
    echo "ethereum/tests exist"
else
    git clone https://github.com/ethereum/tests.git
fi