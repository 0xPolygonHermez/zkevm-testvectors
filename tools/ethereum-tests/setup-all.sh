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
git clone git@github.com:0xPolygonHermez/zkevm-rom.git
cd zkevm-rom
if [ ! -z "$1" ]
    then
    version_rom=$1
else
    version_rom="$(git describe --tags --abbrev=0)"
fi
echo "Version rom: $version_rom"
git checkout $version_rom
npm i
npm run build
commit2="$(grep @0xpolygonhermez/zkevm-proverjs package.json | awk  -F \# '{print $2}')"
commit=${commit2:0:-2} #remove ", from string

cd ..
git clone git@github.com:0xPolygonHermez/zkevm-proverjs.git
cd zkevm-proverjs
git checkout $commit
npm i
cd ../zkevm-testvectors/tools/ethereum-tests/