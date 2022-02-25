# update @ethereumjs library to use CheckpointTrie instead of SecureTrie
# SecureTrie does a hash of the key to insert in the trie
# if storage is dumped and used again, the original key is hashed twice

# No need to set readlink for macOS users
if [ "$OSTYPE" != "darwin"* ]; then
    SCRIPT=$(readlink -f "$0")
    BUILD_CONFIG_HOME=$(dirname "$SCRIPT")

    cd ${BUILD_CONFIG_HOME}/..
fi

# update @ethereumjs library to add:
# - add customTouched seet for handling updated accounts between checkpoints

SCRIPT=`realpath $0`
echo$SCRIPT
SCRIPTPATH=`dirname $SCRIPT`

cp $SCRIPTPATH/../config/baseStateManager.js $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist/state/baseStateManager.js

TOREPLACE="SecureTrie"
NEW="CheckpointTrie"

# node
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist/index.d.ts
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist/index.js
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist/state/stateManager.d.ts
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist/state/stateManager.js

# browser
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist.browser/index.d.ts
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist.browser/index.js
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist.browser/state/stateManager.d.ts
sed -i'' -e "s|$TOREPLACE|$NEW|" $SCRIPTPATH/../node_modules/@ethereumjs/vm/dist.browser/state/stateManager.js