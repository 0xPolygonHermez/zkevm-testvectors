/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');

const { argv } = require('yargs')
    .usage('\nUsage:\n\r\r\r\r$0 [options]')
    .alias('h', 'help')
    .option('r', {
        alias: 'rom',
        demandOption: true,
        describe: 'ROM file path to be analyzed',
        type: 'string'
    })
    .option('i', {
        alias: 'input',
        demandOption: true,
        describe: 'Stats file path to be analyzed',
        type: 'string'
    })
    .option('f', {
        alias: 'folder',
        demandOption: true,
        describe: 'Stats folder path to be analyzed',
        type: 'string'
    })
    .conflicts('i', 'f')
    .option('o', {
        alias: 'output',
        describe: 'Output folder path to store the report',
        type: 'string'
    })
    .option('v', {
        alias: 'verbose',
        describe: 'Prints N lines of the report',
        type: 'number'
    })
    .example('$0 -r arrayTrim.rom.json -i arrayTrim.stats.json -o ~/tmp -v 25')
    .version(false)

const RomCoverage = require('./rom-coverage');

// default values
const defaultReportFolder = path.join(__dirname, 'reports');
const defaultVerboseLines = 25;

async function main() {
    /// /////////////////////
    /// ///PARSE INPUTS//////
    /// /////////////////////

    // ROM path
    const romPath = typeof (argv.rom) === 'string' ? argv.rom.trim() : undefined;

    if (typeof romPath === 'undefined') {
        throw new Error('Path ROM has not been specified');
    }

    if (!fs.existsSync(romPath)) {
        throw new Error(`ROM file ${romPath} does not exist`);
    }

    // Input path
    const inputPath = typeof (argv.input) === 'string' ? argv.input.trim() : undefined;

    if (inputPath && !fs.existsSync(inputPath)) {
        throw new Error(`Input file ${inputPath} does not exist`);
    }

    // Folder path
    const inputFolderPath = typeof (argv.folder) === 'string' ? argv.folder.trim() : undefined;

    if (inputFolderPath && !fs.existsSync(inputFolderPath)) {
        throw new Error(`Folder path ${inputFolderPath} does not exist`);
    }

    // check input/folder
    if (typeof inputPath === 'undefined' && typeof inputFolderPath === 'undefined') {
        throw new Error('Specify an input file (-i <inputpath>) or a folder (-f folderpath)');
    }
    const isMulti = typeof inputFolderPath !== 'undefined';

    // Output path
    const flagOutput = typeof argv.output !== 'undefined';
    let outputFolder = typeof argv.output === 'string' ? argv.output.trim() : undefined;

    // default output path
    if (typeof outputFolder === 'undefined' && flagOutput) {
        outputFolder = defaultReportFolder;
    }

    // verbose
    const flagVerbose = typeof argv.verbose !== 'undefined';
    const numVerboseLines = typeof argv.verbose === 'number' ? argv.verbose : defaultVerboseLines;

    /// /////////////////////
    /// ///RUN COVERAGE//////
    /// /////////////////////
    // Load coverage class
    const iRomCov = new RomCoverage(romPath, outputFolder);

    if (!isMulti) {
        iRomCov.processSingleZkPC(inputPath);
    } else {
        iRomCov.processMultiZkPC(inputFolderPath);
    }

    if (flagOutput) {
        await iRomCov.exportCoverage();
    }

    if (flagVerbose) {
        iRomCov.verbose(numVerboseLines);
    }
}

main();
