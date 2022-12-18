if [ -d "tests" ]
    then
    echo "ethereum/tests exist"
else
    git clone https://github.com/ethereum/tests.git
    cd tests
    git checkout 9e0a5e00981575de017013b635d54891f9e561ef
    cd ../
fi

cd ../../../
git clone -b v0.5.2.0 git@github.com:0xPolygonHermez/zkevm-rom.git
cd zkevm-rom
npm i
npm run build
commit="$(grep @0xpolygonhermez/zkevm-proverjs package.json | awk  -F \# '{print substr($2,0,40)}')"

cd ..
git clone git@github.com:0xPolygonHermez/zkevm-proverjs.git
cd zkevm-proverjs
git checkout $commit
npm i
cd ../zkevm-testvectors/tools/ethereum-tests/