/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');

const folderForcedTx = '../../state-transition/forced-tx';
const listForcedTx = require(`${folderForcedTx}/list.json`);
const genesisList = require(`${folderForcedTx}/genesis-list.json`);
const testEthList = require(`${folderForcedTx}/test-eth-list.json`);
const testsEthPath = '../../tools/ethereum-tests/tests/';
/*
{
    "expectedOldStateRoot",
    genesis: [
        {
            address,
            nonce,
            balance,
            storage,
            pvtKey,
            isSmartContract,
            bytecode,
            abi
        },
        {},
        ...
    ]
    "batchL2Data",
    "expectedNewStateRoot",
    "expectedNewLeafs": [
        {
            address,
            nonce,
            balance,
            storage,
            pvtKey,
            isSmartContract,
            hashBytecode,
            bytecodeLength
        },
        {},
        ...
    ]
}
*/

describe('Generate inputs executor from test-vectors', async function () {
    const listTests = [];
    const jsonList = [];
    const jsonEthList = [];
    const jsonInputList = [];

    it('load test vectors', async () => {
        for (let i = 0; i < listForcedTx.length; i++) {
            const pathForcedTx = `../../${listForcedTx[i]}`;
            let stats = fs.statSync(pathForcedTx);
            if (stats.isDirectory()) {
                fs.readdirSync(pathForcedTx).forEach((subFile) => {
                    listTests.push(`${pathForcedTx}/${subFile}`);
                });
            } else {
                listTests.push(pathForcedTx);
            }
        }
        for (let j = 0; j < listTests.length; j++) {
            const jsonTest = require(listTests[j]);
            const name = listTests[j].split('/')[listTests[j].split('/').length - 1];
            if (listTests[j].includes('ethereum-tests')) {
                jsonEthList.push({ name, test: jsonTest });
            } else if (listTests[j].includes('inputs-executor')) {
                jsonInputList.push({ name, test: jsonTest });
            } else {
                const list = Object.keys(jsonTest);
                if (list[0] === '0') {
                    for (let x = 0; x < list.length; x++) {
                        jsonList.push({ name: `${name.replace('.json', '')}_${list[x]}.json`, test: jsonTest[list[x]] });
                    }
                } else { jsonList.push({ name, test: jsonTest }); }
            }
        }
    });
    it('generate forced info', async () => {
        for (let i = 0; i < jsonList.length; i++) {
            const json = jsonList[i].test;
            const newObject = {
                expectedOldStateRoot: json.oldStateRoot,
                expectedNewStateRoot: json.newStateRoot,
                batchL2Data: json.batchL2Data,
                genesis: [],
                expectedNewLeafs: [],
            };
            for (let j = 0; j < json.genesis.length; j++) {
                const genesis = json.genesis[j];
                newObject.genesis.push({
                    address: genesis.address,
                    nonce: genesis.nonce,
                    balance: genesis.balance,
                    storage: genesis.storage,
                    pvtKey: genesis.pvtKey,
                    isSmartContract: !!genesis.bytecode,
                    bytecode: genesis.bytecode,
                    abi: genesis.abi,
                });
            }
            const newLeafsKeys = Object.keys(json.expectedNewLeafs);
            for (let j = 0; j < newLeafsKeys.length; j++) {
                const address = newLeafsKeys[j];
                const expectedNewLeaf = json.expectedNewLeafs[address];
                console.log(expectedNewLeaf.bytecodeLength);
                newObject.expectedNewLeafs.push({
                    address,
                    nonce: expectedNewLeaf.nonce,
                    balance: expectedNewLeaf.balance,
                    storage: expectedNewLeaf.storage,
                    pvtKey: expectedNewLeaf.pvtKey,
                    isSmartContract: expectedNewLeaf.bytecodeLength !== 0 && expectedNewLeaf.bytecodeLength !== undefined,
                    hashBytecode: expectedNewLeaf.hashBytecode,
                    bytecodeLength: expectedNewLeaf.bytecodeLength,
                });
            }
            await fs.writeFileSync(`${folderForcedTx}/${jsonList[i].name}`, JSON.stringify(newObject, null, 2));
        }
        for (let i = 0; i < jsonInputList.length; i++) {
            const json = jsonInputList[i].test;
            const newObject = {
                expectedOldStateRoot: json.oldStateRoot,
                expectedNewStateRoot: json.newStateRoot,
                batchL2Data: json.batchL2Data,
                genesis: [],
                expectedNewLeafs: [],
            };
            const genesis = genesisList[json.oldStateRoot];
            if (genesis) {
                const genesisKeys = Object.keys(genesisList[json.oldStateRoot]);
                for (let j = 0; j < genesisKeys.length; j++) {
                    const aux = genesis[genesisKeys[j]];
                    newObject.genesis.push({
                        address: genesisKeys[j],
                        nonce: aux.nonce,
                        balance: aux.balance,
                        storage: aux.storage,
                        pvtKey: aux.pvtKey,
                        isSmartContract: !!aux.bytecode,
                        bytecode: aux.bytecode,
                        abi: aux.abi,
                    });
                }
            }

            const newLeafs = genesisList[json.newStateRoot];
            if (newLeafs) {
                const newLeafsKeys = Object.keys(genesisList[json.newStateRoot]);
                for (let j = 0; j < newLeafsKeys.length; j++) {
                    const aux2 = newLeafs[newLeafsKeys[j]];
                    newObject.genesis.push({
                        address: newLeafsKeys[j],
                        nonce: aux2.nonce,
                        balance: aux2.balance,
                        storage: aux2.storage,
                        pvtKey: aux2.pvtKey,
                        isSmartContract: !!aux2.bytecode,
                        hashBytecode: aux2.hashBytecode,
                        bytecodeLength: aux2.bytecodeLength,
                    });
                }
            }

            await fs.writeFileSync(`${folderForcedTx}/${jsonInputList[i].name}`, JSON.stringify(newObject, null, 2));
        }
        for (let i = 0; i < jsonEthList.length; i++) {
            const json = jsonEthList[i].test;
            const newObject = {
                expectedOldStateRoot: json.oldStateRoot,
                expectedNewStateRoot: json.newStateRoot,
                batchL2Data: json.batchL2Data,
                genesis: [],
                expectedNewLeafs: [],
            };
            const infoEthTest = testEthList[jsonEthList[i].name];
            const jsonInfoEthTests = require(testsEthPath + infoEthTest.path);
            const key = Object.keys(jsonInfoEthTests).filter((op) => op.includes('_Berlin') === true)[infoEthTest.index];
            const jsonInfoEthTest = jsonInfoEthTests[key];
            const { pre } = jsonInfoEthTest;
            const genesisKeys = Object.keys(pre);

            for (let j = 0; j < genesisKeys.length; j++) {
                const genKey = genesisKeys[j];
                const infoGenesis = pre[genKey];
                newObject.genesis.push({
                    address: genKey,
                    nonce: infoGenesis.nonce,
                    balance: infoGenesis.balance,
                    storage: infoGenesis.storage,
                    isSmartContract: !!infoGenesis.code,
                    bytecode: infoGenesis.code,
                });
            }
            const { postState } = jsonInfoEthTest;
            const postKeys = Object.keys(postState);
            for (let j = 0; j < postKeys.length; j++) {
                const postKey = postKeys[j];
                const expectedNewLeaf = postState[postKey];
                newObject.expectedNewLeafs.push({
                    address: postKey,
                    nonce: expectedNewLeaf.nonce,
                    balance: expectedNewLeaf.balance,
                    storage: expectedNewLeaf.storage,
                    pvtKey: expectedNewLeaf.pvtKey,
                    isSmartContract: expectedNewLeaf.code !== '0x',
                    bytecode: expectedNewLeaf.code,
                });
            }
            await fs.writeFileSync(`${folderForcedTx}/${jsonEthList[i].name}`, JSON.stringify(newObject, null, 2));
        }
    });
});
