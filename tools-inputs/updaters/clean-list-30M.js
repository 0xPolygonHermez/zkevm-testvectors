const fs = require('fs');
const pathList = "../tools-eth/tests30M-list.json";

fs.readFile(pathList, 'utf8', (err, data) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    let jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch (parseErr) {
        console.error('Error', parseErr);
        return;
    }

    function removeDuplicates(array) {
        const files = new Set();
        return array.filter(item => {
            if (files.has(item.file)) {
                return false;
            } else {
                files.add(item.file);
                return true;
            }
        });
    }

    const cleanedData = removeDuplicates(jsonData);

    fs.writeFile(pathList, JSON.stringify(cleanedData, null, 2), (writeErr) => {
        if (writeErr) {
            console.error('Error:', writeErr);
            return;
        }
        console.log(`WRITE: ${pathList}`);
    });
});
