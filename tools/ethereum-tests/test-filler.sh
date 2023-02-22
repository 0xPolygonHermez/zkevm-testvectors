# REQUIREMENTS:
#     1 - Start docker service
#     2 - Download dretesteth.tar docker image from http://retesteth.ethdevops.io/dretesteth.tar
#     3 - Load docker container from image with `docker load -i dretest*.tar`
#     4 - Update filler files to regenerate
#     5 - Run setup.sh
#     6 - Run this script setting the vars
#
#     sh test-filler.sh [-f/--folder fill all tests from folder]

test_folder_name=$1
absolute_tests_path=$(pwd)/tests
test_file_name=$2
# Read args
run_folder=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--folder)
      run_folder=true
      test_folder_name=$2
      shift # past argument
      ;;
  esac
  shift
done
# Download filler script
if [ -f "dretesteth.sh" ]; then
    echo "Script exists."
else
    wget https://raw.githubusercontent.com/ethereum/retesteth/master/dretesteth.sh
    chmod +x dretesteth.sh
fi

if [ "$run_folder" = true ]; then
    echo "Run full folder"
    # Run dretesteth from docker
    ./dretesteth.sh -t GeneralStateTests/$test_folder_name -- --testpath $absolute_tests_path --fillchain
    # Regen test as executor input
    # npx mocha gen-inputs.js --evm-debug --folder $test_folder_name
else
    # Run dretesteth from docker
    ./dretesteth.sh -t GeneralStateTests/$test_folder_name -- --testpath $absolute_tests_path --singletest $test_file_name --fillchain
    # Regen test as executor input
    # npx mocha gen-inputs.js --evm-debug --test $test_folder_name/$test_file_name.json
fi