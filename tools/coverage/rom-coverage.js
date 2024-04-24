/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const path = require('path');

class RomCoverage {
    constructor(romPath, outputFolder) {
        const rom = JSON.parse(fs.readFileSync(romPath));
        this.romPath = `${romPath.split('build/')[0]}main/`;

        this.outputFolder = outputFolder;

        this.labels = this._swapObject(rom.labels);
        this._parseLabels();
        this._parseRom(rom);
        this._parseJMPS(rom);
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

    _parseJMPS(rom) {
        this.JMPS = {};
        for (let i = 0; i < rom.program.length; i++) {
            const instruction = rom.program[i];
            if (instruction.JMPN) {
                const keyJMPN = `${instruction.fileName}:${instruction.line}:JMPN`;
                this.JMPS[`${keyJMPN}:jmp`] = 0;
                this.JMPS[`${keyJMPN}:else`] = 0;
            }
            if (instruction.JMPZ) {
                const keyJMPZ = `${instruction.fileName}:${instruction.line}:JMPZ`;
                this.JMPS[`${keyJMPZ}:jmp`] = 0;
                this.JMPS[`${keyJMPZ}:else`] = 0;
            }
            if (instruction.JMPC) {
                const keyJMPC = `${instruction.fileName}:${instruction.line}:JMPC`;
                this.JMPS[`${keyJMPC}:jmp`] = 0;
                this.JMPS[`${keyJMPC}:else`] = 0;
            }
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

            // add jmps hit
            const nextZkPC = arrayZkPC[i + 1];
            if (instruction.JMPN) {
                const keyJMPN = `${instruction.fileName}:${instruction.line}:JMPN`;
                if (instruction.jmpAddr === nextZkPC) {
                    this.JMPS[`${keyJMPN}:jmp`] += 1;
                } else {
                    this.JMPS[`${keyJMPN}:else`] += 1;
                }
            }
            if (instruction.JMPZ) {
                const keyJMPZ = `${instruction.fileName}:${instruction.line}:JMPZ`;
                if (instruction.jmpAddr === nextZkPC) {
                    this.JMPS[`${keyJMPZ}:jmp`] += 1;
                } else {
                    this.JMPS[`${keyJMPZ}:else`] += 1;
                }
            }
            if (instruction.JMPC) {
                const keyJMPC = `${instruction.fileName}:${instruction.line}:JMPC`;
                if (instruction.jmpAddr === nextZkPC) {
                    this.JMPS[`${keyJMPC}:jmp`] += 1;
                } else {
                    this.JMPS[`${keyJMPC}:else`] += 1;
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

        // sort jmps
        tmpArray = Object.entries(this.JMPS);
        sortArray = tmpArray.sort((a, b) => b[1] - a[1]);
        this.JMPS = Object.fromEntries(sortArray);
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

                // add jmps hit
                const nextZkPC = arrayZkPC[i + 1];
                if (instruction.JMPN) {
                    const keyJMPN = `${instruction.fileName}:${instruction.line}:JMPN`;
                    if (instruction.jmpAddr === nextZkPC) {
                        this.JMPS[`${keyJMPN}:jmp`] += 1;
                    } else {
                        this.JMPS[`${keyJMPN}:else`] += 1;
                    }
                }
                if (instruction.JMPZ) {
                    const keyJMPZ = `${instruction.fileName}:${instruction.line}:JMPZ`;
                    if (instruction.jmpAddr === nextZkPC) {
                        this.JMPS[`${keyJMPZ}:jmp`] += 1;
                    } else {
                        this.JMPS[`${keyJMPZ}:else`] += 1;
                    }
                }
                if (instruction.JMPC) {
                    const keyJMPC = `${instruction.fileName}:${instruction.line}:JMPC`;
                    if (instruction.jmpAddr === nextZkPC) {
                        this.JMPS[`${keyJMPC}:jmp`] += 1;
                    } else {
                        this.JMPS[`${keyJMPC}:else`] += 1;
                    }
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

        // sort jmps
        tmpArray = Object.entries(this.JMPS);
        sortArray = tmpArray.sort((a, b) => b[1] - a[1]);
        this.JMPS = Object.fromEntries(sortArray);
    }

    _initMulti() {
        this.multiFile = true;
        this.baseName = `${new Date().toISOString()}`;
    }

    async exportCoverage() {
        if (!fs.existsSync(this.outputFolder)) {
            fs.mkdirSync(this.outputFolder);
        }
        if(this.romPath.includes("blob")) {
            if (!fs.existsSync(`${this.outputFolder}/rom-blob`)) {
                fs.mkdirSync(`${this.outputFolder}/rom-blob`);
            }
        } else {
            if (!fs.existsSync(`${this.outputFolder}/rom`)) {
                fs.mkdirSync(`${this.outputFolder}/rom`);
            }
        }

        let labelPath;
        let instructionsPath;
        let jmpsPath;

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

        if (this.multiFile) {
            jmpsPath = `${this.outputFolder}/${this.baseName}-multi-jmps.json`;
        } else {
            jmpsPath = `${this.outputFolder}/${this.baseName}-jmps.json`;
        }

        fs.writeFileSync(labelPath, JSON.stringify(this.traceLabels, null, 2));
        fs.writeFileSync(instructionsPath, JSON.stringify(this.traceInstructions, null, 2));
        fs.writeFileSync(jmpsPath, JSON.stringify(this.JMPS, null, 2));

        // EXPORTS ROM
        const noHitLines = [];
        const noHitFiles = [];

        for (const line in this.traceInstructions) {
            if (this.traceInstructions[line] === 0) {
                noHitLines.push(line);
                const fileRom = line.split(':')[0];
                if (noHitFiles.filter((file) => file.file === fileRom).length === 0) {
                    noHitFiles.push({ file: fileRom, lines: [line.split(':')[1]], jmps: [] });
                } else {
                    noHitFiles[noHitFiles.findIndex((loopFiles) => loopFiles.file === fileRom)].lines.push(line.split(':')[1]);
                }
            }
        }

        // for (const jmp in this.JMPS) {
        //     if (this.JMPS[jmp] === 0) {
        //         const fileRom = jmp.split(':')[0];
        //         if (noHitFiles.filter((file) => file.file === fileRom).length === 0) {
        //             noHitFiles.push({ file: fileRom, lines: [], jmps: [`${jmp.split(':')[1]}:${jmp.split(':')[3]}`] });
        //         } else {
        //             noHitFiles[noHitFiles.findIndex((loopFiles) => loopFiles.file === fileRom)].jmps.push(`${jmp.split(':')[1]}:${jmp.split(':')[3]}`);
        //         }
        //     }
        // }

        for (let i = 0; i < noHitFiles.length; i++) {
            if (noHitFiles[i].file) {
                let outputArray;
                let acc = '';
                if(this.romPath.includes("blob")) {
                    outputArray = `${this.outputFolder}/rom-blob/${noHitFiles[i].file}`.split('/rom-blob/')[1].split('/');
                    acc = `${this.outputFolder}/rom-blob`;
                } else {
                    outputArray = `${this.outputFolder}/rom/${noHitFiles[i].file}`.split('/rom/')[1].split('/');
                    acc = `${this.outputFolder}/rom`;
                }
                
                for (let j = 0; j < outputArray.length - 1; j++) {
                    acc += `/${outputArray[j]}`;
                    if (!fs.existsSync(acc)) {
                        fs.mkdirSync(acc);
                    }
                }
                const fileData = fs.readFileSync(this.romPath + noHitFiles[i].file, 'utf-8').split('\n');
                for (let k = 0; k < noHitFiles[i].lines.length; k++) {
                    const line = fileData[noHitFiles[i].lines[k] - 1];
                    if (line !== '') {
                        fileData[noHitFiles[i].lines[k] - 1] = `++++++++${line}`;
                    }
                }
                // for (let k = 0; k < noHitFiles[i].jmps.length; k++) {
                //     const line = fileData[noHitFiles[i].jmps[k].split(':')[0] - 1];
                //     if (line !== '') {
                //         fileData[noHitFiles[i].jmps[k].split(':')[0]] = `--------${noHitFiles[i].jmps[k].split(':')[1]}`;
                //     }
                // }
                // if (noHitFiles[i].lines.length > 0 || noHitFiles[i].jmps.length > 0) {
                if (noHitFiles[i].lines.length > 0) {
                    if(this.romPath.includes("blob")) {
                        fs.writeFileSync(`${this.outputFolder}/rom-blob/${noHitFiles[i].file}`, fileData.join('\n'));
                    } else {
                        fs.writeFileSync(`${this.outputFolder}/rom/${noHitFiles[i].file}`, fileData.join('\n'));
                    }
                }
            }
        }
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
