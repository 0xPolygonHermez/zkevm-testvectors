const fs = require('fs');
const path = require('path');

function renameFilesInDirectory(directory) {
    fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error(`Error leyendo el directorio: ${err}`);
            return;
        }

        entries.forEach(entry => {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                renameFilesInDirectory(fullPath);
            } else if (entry.isFile()) {
                // Verifica si el nombre del archivo contiene "modexp" y "-ignore"
                if (entry.name.includes("modexp") && entry.name.includes("-ignore")) {
                    const newName = entry.name.replace("-ignore", "");
                    const newPath = path.join(directory, newName);

                    fs.rename(fullPath, newPath, err => {
                        if (err) {
                            console.error(`Error renombrando el archivo: ${err}`);
                        } else {
                            console.log(`Renamed: "${fullPath}" to "${newPath}"`);
                        }
                    });
                }
            }
        });
    });
}

// Especifica la ruta de la carpeta que deseas procesar
const directoryPath = '../../inputs-executor';
renameFilesInDirectory(directoryPath);