const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { argv } = require('yargs');

const {
    smtUtils, getPoseidon, Constants,
} = require('@polygon-hermez/zkevm-commonjs');
const { pathTestVectors } = require('../helpers/helpers');

// eslint-disable-next-line prefer-arrow-callback
describe('smt-keys', async function () {
    this.timeout(60000);

    const pathKeysBalance = path.join(pathTestVectors, 'merkle-tree/smt-key-eth-balance.json');
    const pathKeysNonce = path.join(pathTestVectors, 'merkle-tree/smt-key-eth-nonce.json');
    const pathKeysContractCode = path.join(pathTestVectors, 'merkle-tree/smt-key-contract-code.json');
    const pathKeysContractStorage = path.join(pathTestVectors, 'merkle-tree/smt-key-contract-storage.json');
    const pathHashBytecode = path.join(pathTestVectors, 'merkle-tree/smt-hash-bytecode.json');

    let update;
    let poseidon;
    let F;
    let testVectorsKeysBalance;
    let testVectorsKeysNonce;
    let testVectorsKeysContractStorage;
    let testVectorsKeysContractCode;
    let testVectorsHashBytecode;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectorsKeysBalance = JSON.parse(fs.readFileSync(pathKeysBalance));
        testVectorsKeysNonce = JSON.parse(fs.readFileSync(pathKeysNonce));
        testVectorsKeysContractCode = JSON.parse(fs.readFileSync(pathKeysContractCode));
        testVectorsKeysContractStorage = JSON.parse(fs.readFileSync(pathKeysContractStorage));
        testVectorsHashBytecode = JSON.parse(fs.readFileSync(pathHashBytecode));

        update = argv.update === true;
    });

    it('keyEthAddrBalance', async () => {
        for (let i = 0; i < testVectorsKeysBalance.length; i++) {
            const {
                leafType, arity, ethAddr, expectedKey,
            } = testVectorsKeysBalance[i];

            const res = await smtUtils.keyEthAddrBalance(ethAddr, arity);

            if (update) {
                testVectorsKeysBalance[i].expectedKey = F.toString(res);
            } else {
                expect(F.toString(res)).to.be.equal(expectedKey);
                expect(leafType).to.be.equal(Constants.SMT_KEY_BALANCE);
            }
        }

        if (update) {
            fs.writeFileSync(pathKeysBalance, JSON.stringify(testVectorsKeysBalance, null, 2));
        }
    });

    it('keyEthAddrNonce', async () => {
        for (let i = 0; i < testVectorsKeysNonce.length; i++) {
            const {
                leafType, arity, ethAddr, expectedKey,
            } = testVectorsKeysNonce[i];

            const res = await smtUtils.keyEthAddrNonce(ethAddr, arity);

            if (update) {
                testVectorsKeysNonce[i].expectedKey = F.toString(res);
            } else {
                expect(F.toString(res)).to.be.equal(expectedKey);
                expect(leafType).to.be.equal(Constants.SMT_KEY_NONCE);
            }
        }

        if (update) {
            fs.writeFileSync(pathKeysNonce, JSON.stringify(testVectorsKeysNonce, null, 2));
        }
    });

    it('keyContractCode', async () => {
        for (let i = 0; i < testVectorsKeysContractCode.length; i++) {
            const {
                leafType, arity, ethAddr, expectedKey,
            } = testVectorsKeysContractCode[i];

            const res = await smtUtils.keyContractCode(ethAddr, arity);

            if (update) {
                testVectorsKeysContractCode[i].expectedKey = F.toString(res);
            } else {
                expect(F.toString(res)).to.be.equal(expectedKey);
                expect(leafType).to.be.equal(Constants.SMT_KEY_SC_CODE);
            }
        }

        if (update) {
            fs.writeFileSync(pathKeysContractCode, JSON.stringify(testVectorsKeysContractCode, null, 2));
        }
    });

    it('keyContractStorage', async () => {
        for (let i = 0; i < testVectorsKeysContractStorage.length; i++) {
            const {
                leafType, arity, ethAddr, storagePosition, expectedKey,
            } = testVectorsKeysContractStorage[i];

            const res = await smtUtils.keyContractStorage(ethAddr, storagePosition, arity);

            if (update) {
                testVectorsKeysContractStorage[i].expectedKey = F.toString(res);
            } else {
                expect(F.toString(res)).to.be.equal(expectedKey);
                expect(leafType).to.be.equal(Constants.SMT_KEY_SC_STORAGE);
            }
        }

        if (update) {
            fs.writeFileSync(pathKeysContractStorage, JSON.stringify(testVectorsKeysContractStorage, null, 2));
        }
    });

    it('hashContractBytecode', async () => {
        for (let i = 0; i < testVectorsHashBytecode.length; i++) {
            const { bytecode, expectedHash } = testVectorsHashBytecode[i];
            const hashBytecode = await smtUtils.hashContractBytecode(bytecode);
            if (update) {
                testVectorsHashBytecode[i].expectedHash = hashBytecode;
            } else {
                expect(hashBytecode).to.be.equal(expectedHash);
            }
        }

        if (update) {
            fs.writeFileSync(pathHashBytecode, JSON.stringify(testVectorsHashBytecode, null, 2));
        }
    });
});
