const fs = require('fs');
const path = require('path');
const { contractUtils } = require('@0xpolygonhermez/zkevm-commonjs');
const { argv } = require('yargs')
    .alias('d', 'dir');

async function main() {
    // path dir
    const dir = typeof argv.dir === 'string' ? argv.dir.trim() : undefined;

    if (dir === undefined) {
        throw new Error('"Dir" parameter is undefined');
    }

    const folders = [];
    folders.push(path.join(__dirname, dir.trim()));
    console.log(folders);
    while (folders.length > 0) {
        const files = folders.pop();
        fs.readdirSync(files).forEach((file) => {
            const fileDir = `${files}/${file}`;
            // Check is a dir
            if (fs.lstatSync(fileDir).isDirectory()) {
                folders.push(`${fileDir}/`);
                return;
            }
            // Check is json files
            if (!file.endsWith('.json')) {
                return;
            }
            // Print file name
            const data = JSON.parse(fs.readFileSync(fileDir, 'utf8'));

            if (data.batchL2Data.slice(-2) !== 'ff') {
                data.batchL2Data += 'ff';
                data.batchHashData = contractUtils.calculateBatchHashData(
                    data.batchL2Data,
                );

                data.newAccInputHash = contractUtils.calculateAccInputHash(
                    data.oldAccInputHash,
                    data.batchHashData,
                    data.globalExitRoot,
                    data.timestamp,
                    data.sequencerAddr,
                );

                // Update data
                fs.writeFileSync(fileDir, JSON.stringify(data, null, 2));
                console.log(`Update ${fileDir}`);
            }
        });
    }
}

main().then(() => {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
