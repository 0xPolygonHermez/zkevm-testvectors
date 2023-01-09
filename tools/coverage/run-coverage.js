/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');

const { argv } = require('yargs')
    .usage('run-coverage')
    .alias('r', 'rom')
    .alias('i', 'input')
    .alias('f', 'folder')
    .alias('o', 'output')
    .alias('v', 'verbose');

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
        iRomCov.exportCoverage();
    }

    if (flagVerbose) {
        iRomCov.verbose(numVerboseLines);
    }
}

main();
