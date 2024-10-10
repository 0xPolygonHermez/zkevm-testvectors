const fs = require('fs');
const path = require('path');

// const sourceEth = '../../../ethereum-tests/';
const sourceDir = '../../../ethereum-tests/BlockchainTests/GeneralStateTests';
// const newJsonEth = '../../../eth-ethereum-tests/';
const newJsonDir = '../../../eth-ethereum-tests/BlockchainTests/GeneralStateTests';

const lineToFind = "0x0000000000000000000000000000000000000100";

const readFilesRecursively = (dir) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error(`Error leyendo el directorio: ${err}`);
            return;
        }
        
        files.forEach((file) => {
            const filePath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                readFilesRecursively(filePath);
            } else if (file.isFile() && path.extname(file.name) === '.json') {
                processJsonFile(filePath, file.name.replace(".json", ""));
            }
        });
    });
};

const processJsonFile = (filePath, name) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error leyendo el archivo ${filePath}: ${err}`);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            for (const x in jsonData) {
                if (jsonData.hasOwnProperty(x)) {
                    if (jsonData[x]["pre"][lineToFind]) {
                        copyNewJson(filePath, jsonData[x]["_info"]["source"]);
                    }
                }
            }
        } catch (parseErr) {
            console.error(`Error parseando el archivo ${filePath}: ${parseErr}`);
        }
    });
};

const copyNewJson = (filePath, source) => {
    const newJsonFilePath = filePath;
    const destFilePath = filePath.replace(sourceDir, newJsonDir);
    fs.copyFile(destFilePath, newJsonFilePath, (err) => {
             if (err) {
                 console.error(`Error ${destFilePath}: ${err}`);
             } else {
                 console.log(`New JSON ${newJsonFilePath}`);
             }
    });
    // const newJsonFilePathFiller = sourceEth+source;
    // const destFilePathFiller = newJsonEth+source;
    // fs.copyFile(destFilePathFiller, newJsonFilePathFiller, (err) => {
    //     if (err) {
    //         console.error(`Error copiando el nuevo JSON ${destFilePathFiller}: ${err}`);
    //     } else {
    //         console.log(`Nuevo JSON copiado a ${newJsonFilePathFiller}`);
    //     }
    //  });
};

readFilesRecursively(sourceDir);