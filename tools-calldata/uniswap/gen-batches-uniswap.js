/* eslint-disable no-use-before-define */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
const Common = require('@ethereumjs/common').default;
const { Hardfork } = require('@ethereumjs/common');
const { BN, toBuffer } = require('ethereumjs-util');
const { ethers } = require('ethers');
const hre = require('hardhat');
const lodash = require('lodash');

const zkcommonjs = require('@0xpolygonhermez/zkevm-commonjs');
const { expect } = require('chai');
const { Transaction } = require('@ethereumjs/tx');

const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const helpers = require('../helpers/helpers');

describe('Generate inputs executor from test-vectors', async function () {
    this.timeout(100000);
    let poseidon;
    let F;
    let inputName;
    let update;
    let outputFlag;
    let testVectorDataPath;
    let testVectors;
    let inputsPath;
    let internalTestVectors;
    let internalTestVectorsPath;
    let evmDebug;
    let file;

    before(async () => {
        poseidon = await zkcommonjs.getPoseidon();
        F = poseidon.F;
    });

    it('compile contracts', async () => {
        await hre.run('compile');
    });
});
