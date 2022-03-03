const fs = require("fs");
const path = require("path");
const { argv } = require('yargs');
const helpers = require("./helpers")

async function main() {
    if(argv.input) {
        if(!fs.existsSync(argv.input)) {
            console.log("Input not exist")
            return;
        }
        const input = require(argv.input);
        console.log("Input Path:", argv.input);
        const newInput = helpers.calculatebatchHashDataFromInput(input);
        // Save outuput in file
        await fs.writeFileSync(argv.input, JSON.stringify(newInput, null, 2));
    } else if(argv.folder) {
        let inputsPath = path.join(__dirname, argv.folder.trim());
        if (!inputsPath.endsWith("/")) inputsPath = inputsPath + "/"
        if(fs.existsSync(inputsPath)) {
            fs.readdirSync(inputsPath).forEach(async function(file) {
                if(file.endsWith(".json")) {
                    const input = require(inputsPath+file);
                    console.log("Input Path:", inputsPath+file);
                    const newInput = helpers.calculatebatchHashDataFromInput(input);
                    // Save outuput in file
                    await fs.writeFileSync(inputsPath+file, JSON.stringify(newInput, null, 2));
                } else {
                    var stats = fs.statSync(inputsPath+file);
                    if(stats.isDirectory()) {
                        fs.readdirSync(inputsPath+file).forEach(async function(subFile) {
                            if(subFile.endsWith(".json")){
                                const input = require(inputsPath+file+"/"+subFile);
                                console.log("Input Path:", inputsPath+file+"/"+subFile);
                                const newInput = helpers.calculatebatchHashDataFromInput(input);
                                // Save outuput in file
                                await fs.writeFileSync(inputsPath+file+"/"+subFile, JSON.stringify(newInput, null, 2));
                            }
                        });
                    }
                }
            });
        } else {
            console.log("Folder not exist");
            return;
        }
    } else {
        console.log("input path or folder path required")
        return;
    }
}

main().then(() => {
    process.exit(0);
}, (err) => {
    process.exit(1);
});