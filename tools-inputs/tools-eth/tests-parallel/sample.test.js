/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const argv = require('yargs');

const { newCommitPolsArray } = require('pilcom');

const smMain = require('../../../../../zkevm-proverjs/src/sm/sm_main/sm_main');
// const smMain = require('../../../../../zkevm-proverjs-internal/src/sm/sm_main/sm_main');

let rom = require('../../../../../zkevm-rom/build/rom.json');
// let rom = require('../../../../../zkevm-rom-internal/build/rom.json');

let stepsN = 2 ** 23;
let counters = false;

const fileCachePil = path.join(__dirname, '../../../../../zkevm-proverjs/cache-main-pil.json');
// const fileCachePil = path.join(__dirname, '../../../../../zkevm-proverjs-internal/cache-main-pil.json');

const checkerDir = path.join(__dirname, '../checker.txt');

const inputPath = '%%INPUT_PATH%%';
const nameFile = path.basename(inputPath);
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const stepRetries = 3;
let currentTries = 0;

it(`${nameFile}`, async () => {
    // if (fs.existsSync(checkerDir)) {
    //    process.exit(1);
    // }
    const pil = JSON.parse(fs.readFileSync(fileCachePil));
    const cmPols = newCommitPolsArray(pil);
    if (input.gasLimit) {
        rom = require(`../../../../../zkevm-rom/build/rom-${input.gasLimit}.test.json`);
        // rom = require(`../../../../../zkevm-rom-internal/build/rom-${input.gasLimit}.test.json`);
    }
    if (input.stepsN) {
        stepsN = input.stepsN;
        counters = true;
    }
    await runTest(cmPols, stepsN);

    expect(true).to.be.equal(true);
});

async function runTest(cmPols, steps) {
    try {
        const config = {
            debug: true,
            debugInfo: {
                inputName: path.basename(inputPath),
            },
            stepsN: steps,
            counters,
            assertOutputs: true,
            stats: true,
        };

        await smMain.execute(cmPols.Main, input, rom, config);
    } catch (err) {
        console.log('Increasing stepsN....');
        // If fails for ooc, retry increasing stepsN up to three times
        if (inputPath.includes('invalid-batch')) {
            return;
        } if (err.toString().includes('OOCS') && currentTries < stepRetries) {
            console.log('FileName: ', inputPath);
            console.log('Counters: true');
            console.log('StepsN: ', steps);
            currentTries += 1;
            counters = true;
            await runTest(cmPols, steps * 2);
            let dataInfo = await fs.readFileSync(checkerDir, 'utf8');
            dataInfo += '\n------------------------------------------------';
            dataInfo += `\nFileName: ${inputPath}`;
            dataInfo += '\nCounters: true';
            dataInfo += `\nStepsN: ${steps * 2}`;
            fs.writeFileSync(checkerDir, dataInfo);

            const inputInfo = JSON.parse(fs.readFileSync(inputPath));
            inputInfo.stepsN = steps * 2;
            fs.writeFileSync(inputPath, JSON.stringify(inputInfo, null, 2));

            return;
        } if (err.toString().includes('OOC') && !err.toString().includes('OOCS') && currentTries < stepRetries) {
            console.log('FileName: ', inputPath);
            console.log('Counters: true');
            currentTries += 1;
            counters = true;
            await runTest(cmPols, steps);
            let dataInfo = await fs.readFileSync(checkerDir, 'utf8');
            dataInfo += '\n------------------------------------------------';
            dataInfo += `\nFileName: ${inputPath}`;
            dataInfo += '\nCounters: true';
            fs.writeFileSync(checkerDir, dataInfo);

            const inputInfo = JSON.parse(fs.readFileSync(inputPath));
            inputInfo.stepsN = steps;
            fs.writeFileSync(inputPath, JSON.stringify(inputInfo, null, 2));
            return;
        }
        fs.writeFileSync(checkerDir, `Failed test ${inputPath} - ${err}}`);
        throw err;
    }
}
