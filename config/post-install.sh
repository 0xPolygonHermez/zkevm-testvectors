# update @ethereumjs library to add:
# - 'putRaw' method on 'SecureTrie' to store [key, values] without hashing the key
# - 'putContractStorageRaw' on 'StateManager' to allow loading storage without hashing the key twice

SCRIPT=$(readlink -f "$0")
BUILD_CONFIG_HOME=$(dirname "$SCRIPT")

cd ${BUILD_CONFIG_HOME}/..

cp config/secure.js node_modules/merkle-patricia-tree/dist/secure.js
cp config/stateManager.js node_modules/@ethereumjs/vm/dist/state/stateManager.js