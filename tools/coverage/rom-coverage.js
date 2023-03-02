/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const path = require('path');

class RomCoverage {
    constructor(romPath, outputFolder) {
        const rom = JSON.parse(fs.readFileSync(romPath));

        this.outputFolder = outputFolder;

        this.labels = this._swapObject(rom.labels);
        this._parseLabels();
        this._parseRom(rom);
        this.program = rom.program;
    }

    _swapObject(obj) {
        const newObj = {};

        for (const [key, value] of Object.entries(obj)) {
            newObj[value] = key;
        }

        return newObj;
    }

    _parseLabels() {
        this.traceLabels = {};

        for (const elem of Object.values(this.labels)) {
            this.traceLabels[elem] = 0;
        }
    }

    _parseRom(rom) {
        this.traceInstructions = {};

        for (let i = 0; i < rom.program.length; i++) {
            this.traceInstructions[`${rom.program[i].fileName}:${rom.program[i].line}`] = {
                hits: 0,
                label: this._findLabel(i),
            };
        }
    }

    _findLabel(zkPC) {
        return this.labels[zkPC];
    }

    processSingleZkPC(inputPath) {
        this._initSingle(inputPath);

        const arrayZkPC = JSON.parse(fs.readFileSync(inputPath));

        for (let i = 0; i < arrayZkPC.length; i++) {
            const zkPC = arrayZkPC[i];

            const instruction = this.program[zkPC];

            // add label hit
            if (typeof this.labels[zkPC] !== 'undefined') {
                this.traceLabels[this.labels[zkPC]] += 1;
            }

            // add instruction hit
            const keyInstruction = `${instruction.fileName}:${instruction.line}`;
            if (typeof this.traceInstructions[keyInstruction] !== 'undefined') {
                this.traceInstructions[keyInstruction].hits += 1;
            }
        }

        // sort labels
        let tmpArray = Object.entries(this.traceLabels);
        let sortArray = tmpArray.sort((a, b) => b[1] - a[1]);
        this.traceLabels = Object.fromEntries(sortArray);

        // sort instructions
        tmpArray = [];
        for (const [key, value] of Object.entries(this.traceInstructions)) {
            tmpArray.push([key, value.hits]);
        }
        sortArray = tmpArray.sort((a, b) => b[1] - a[1]);
        this.traceInstructions = Object.fromEntries(sortArray);
    }

    _initSingle(inputPath) {
        this.multiFile = false;

        const parsedInputPath = inputPath.replace('-stats', '');
        this.baseName = `${path.parse(parsedInputPath).name}`;
    }

    processMultiZkPC(inputFolder) {
        this._initMulti();

        // read all files from folder
        const files = fs.readdirSync(inputFolder);

        // filter stats file
        const filesStats = files.filter((fileName) => fileName.includes('-stats'));
        for (let j = 0; j < filesStats.length; j++) {
            const arrayZkPC = JSON.parse(fs.readFileSync(path.join(inputFolder, filesStats[j])));

            for (let i = 0; i < arrayZkPC.length; i++) {
                const zkPC = arrayZkPC[i];

                const instruction = this.program[zkPC];

                // add label hit
                if (typeof this.labels[zkPC] !== 'undefined') {
                    this.traceLabels[this.labels[zkPC]] += 1;
                }

                // add instruction hit
                const keyInstruction = `${instruction.fileName}:${instruction.line}`;
                if (typeof this.traceInstructions[keyInstruction] !== 'undefined') {
                    this.traceInstructions[keyInstruction].hits += 1;
                }
            }
        }

        // sort labels
        let tmpArray = Object.entries(this.traceLabels);
        let sortArray = tmpArray.sort((a, b) => b[1] - a[1]);
        this.traceLabels = Object.fromEntries(sortArray);

        // sort instructions
        tmpArray = [];
        for (const [key, value] of Object.entries(this.traceInstructions)) {
            tmpArray.push([key, value.hits]);
        }
        sortArray = tmpArray.sort((a, b) => b[1] - a[1]);
        this.traceInstructions = Object.fromEntries(sortArray);
    }

    _initMulti() {
        this.multiFile = true;
        this.baseName = `${new Date().toISOString()}`;
    }

    exportCoverage() {
        if (!fs.existsSync(this.outputFolder)) {
            fs.mkdirSync(this.outputFolder);
        }

        let labelPath;
        let instructionsPath;

        if (this.multiFile) {
            labelPath = `${this.outputFolder}/${this.baseName}-multi-labels.json`;
        } else {
            labelPath = `${this.outputFolder}/${this.baseName}-labels.json`;
        }

        if (this.multiFile) {
            instructionsPath = `${this.outputFolder}/${this.baseName}-multi-instructions.json`;
        } else {
            instructionsPath = `${this.outputFolder}/${this.baseName}-instructions.json`;
        }

        fs.writeFileSync(labelPath, JSON.stringify(this.traceLabels, null, 2));
        fs.writeFileSync(instructionsPath, JSON.stringify(this.traceInstructions, null, 2));
    }

    verbose(numLines) {
        // print header
        console.log('////////// HEADER ///////////\n');
        console.log(`Total ROM instructions: ${this.program.length}\n`);

        // print first numLines of labels
        console.log('////////// LABELS ///////////\n');

        const linesLabels = (numLines > Object.keys(this.traceLabels).length) ? Object.keys(this.traceLabels).length : numLines;

        let counter = 0;
        for (const [key, value] of Object.entries(this.traceLabels)) {
            console.log(`${key.padEnd(30)} | ${value}`);
            counter += 1;
            if (counter >= linesLabels) {
                break;
            }
        }

        // print first numLines of labels
        console.log('\n\n//////// INSTRUCTIONS ///////\n');

        const linesInstructions = (numLines > Object.keys(this.traceInstructions).length)
            ? Object.keys(this.traceInstructions).length : numLines;

        counter = 0;
        for (const [key, value] of Object.entries(this.traceInstructions)) {
            console.log(`${key.padEnd(30)} | ${value}`);
            counter += 1;
            if (counter >= linesInstructions) {
                break;
            }
        }

        // print no hit lines in multi-mode
        console.log('\n\n////// NO HIT LINES /////\n');
        const noHitLines = [];
        for (const [key, value] of Object.entries(this.traceInstructions)) {
            if (value === 0) {
                noHitLines.push([key, value]);
            }
        }

        console.log(`Total lines no hit: ${noHitLines.length}\n\n`);

        this.traceNoHitLines = Object.fromEntries(noHitLines);

        for (const [key] of Object.entries(this.traceNoHitLines)) {
            // console.log(`${key.padEnd(30)}`);
        }
    }
}

module.exports = RomCoverage;
