/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const { Scalar } = require('ffjavascript');

const folderForcedTxInputs = './forced-tx';
const { smtUtils } = require('@0xpolygonhermez/zkevm-commonjs');
const genesisList = require('./genesis-list.json');
const testEthList = require('./test-eth-list.json');

const testsEthPath = '../tools-eth/tests/';
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
    const jsonList = [];
    const jsonEthList = [];
    const jsonInputList = [];

    it('load test vectors', async () => {
        const listTests = fs.readdirSync('../../inputs-executor/special-inputs-ignored/forcedtx-inputs-ignore').filter((x) => x.endsWith('.json'));
        for (let j = 0; j < listTests.length; j++) {
            const jsonTest = require(`../../inputs-executor/special-inputs-ignored/forcedtx-inputs-ignore/${listTests[j]}`);
            const name = listTests[j].split('/')[listTests[j].split('/').length - 1];
            console.log(name);
            if (listTests[j].startsWith('eth-')) {
                jsonEthList.push({ name, test: jsonTest });
            } else if (listTests[j].startsWith('in-')) {
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
            console.log(jsonList[i].name);
            for (let j = 0; j < json.genesis.length; j++) {
                const genesis = json.genesis[j];
                newObject.genesis.push({
                    address: genesis.address,
                    nonce: genesis.nonce.toString().startsWith('0x') ? Scalar.e(genesis.nonce, 16).toString() : Scalar.e(genesis.nonce).toString(),
                    balance: genesis.balance.toString().startsWith('0x') ? Scalar.e(genesis.balance, 16).toString() : Scalar.e(genesis.balance).toString(),
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
                newObject.expectedNewLeafs.push({
                    address,
                    nonce: expectedNewLeaf.nonce.toString().startsWith('0x') ? Scalar.e(expectedNewLeaf.nonce, 16).toString() : Scalar.e(expectedNewLeaf.nonce).toString(),
                    balance: expectedNewLeaf.balance.toString().startsWith('0x') ? Scalar.e(expectedNewLeaf.balance, 16).toString() : Scalar.e(expectedNewLeaf.balance).toString(),
                    storage: expectedNewLeaf.storage,
                    pvtKey: expectedNewLeaf.pvtKey,
                    isSmartContract: expectedNewLeaf.bytecodeLength !== 0 && expectedNewLeaf.bytecodeLength !== undefined,
                    hashBytecode: expectedNewLeaf.hashBytecode,
                    bytecodeLength: expectedNewLeaf.bytecodeLength,
                });
            }
            // await fs.writeFileSync(`${folderForcedTx}/${jsonList[i].name}`, JSON.stringify(newObject, null, 2));
            await fs.writeFileSync(`${folderForcedTxInputs}/${jsonList[i].name}`, JSON.stringify(newObject, null, 2));
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
                        nonce: aux.nonce.toString().startsWith('0x') ? Scalar.e(aux.nonce, 16).toString() : Scalar.e(aux.nonce).toString(),
                        balance: aux.balance.toString().startsWith('0x') ? Scalar.e(aux.balance, 16).toString() : Scalar.e(aux.balance).toString(),
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
                        nonce: aux2.nonce.toString().startsWith('0x') ? Scalar.e(aux2.nonce, 16).toString() : Scalar.e(aux2.nonce).toString(),
                        balance: aux2.balance.toString().startsWith('0x') ? Scalar.e(aux2.balance, 16).toString() : Scalar.e(aux2.balance).toString(),
                        storage: aux2.storage,
                        pvtKey: aux2.pvtKey,
                        isSmartContract: !!aux2.bytecode,
                        hashBytecode: aux2.hashBytecode,
                        bytecodeLength: aux2.bytecodeLength,
                    });
                }
            }

            // await fs.writeFileSync(`${folderForcedTx}/${jsonInputList[i].name}`, JSON.stringify(newObject, null, 2));
            await fs.writeFileSync(`${folderForcedTxInputs}/${jsonInputList[i].name}`, JSON.stringify(newObject, null, 2));
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
            const infoEthTest = testEthList[jsonEthList[i].name.substring(4)];
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
                    nonce: infoGenesis.nonce.toString().startsWith('0x') ? Scalar.e(infoGenesis.nonce, 16).toString() : Scalar.e(infoGenesis.nonce).toString(),
                    balance: infoGenesis.balance.toString().startsWith('0x') ? Scalar.e(infoGenesis.balance, 16).toString() : Scalar.e(infoGenesis.balance).toString(),
                    storage: infoGenesis.storage,
                    isSmartContract: !!infoGenesis.code && infoGenesis.code !== '0x',
                    bytecode: infoGenesis.code,
                    hashBytecode: infoGenesis.code === '0x' ? undefined : await smtUtils.hashContractBytecode(infoGenesis.code),
                });
            }
            const { postState } = jsonInfoEthTest;
            const postKeys = Object.keys(postState);
            for (let j = 0; j < postKeys.length; j++) {
                const postKey = postKeys[j];
                const expectedNewLeaf = postState[postKey];
                newObject.expectedNewLeafs.push({
                    address: postKey,
                    nonce: expectedNewLeaf.nonce.toString().startsWith('0x') ? Scalar.e(expectedNewLeaf.nonce, 16).toString() : Scalar.e(expectedNewLeaf.nonce).toString(),
                    balance: expectedNewLeaf.balance.toString().startsWith('0x') ? Scalar.e(expectedNewLeaf.balance, 16).toString() : Scalar.e(expectedNewLeaf.balance).toString(),
                    storage: expectedNewLeaf.storage,
                    pvtKey: expectedNewLeaf.pvtKey,
                    isSmartContract: expectedNewLeaf.code !== '0x',
                    bytecode: expectedNewLeaf.code,
                    hashBytecode: expectedNewLeaf.code === '0x' ? undefined : await smtUtils.hashContractBytecode(expectedNewLeaf.code),
                });
            }
            // await fs.writeFileSync(`${folderForcedTx}/${jsonEthList[i].name}`, JSON.stringify(newObject, null, 2));
            await fs.writeFileSync(`${folderForcedTxInputs}/${jsonEthList[i].name}`, JSON.stringify(newObject, null, 2));
        }
    });
});
