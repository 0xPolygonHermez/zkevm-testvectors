/* eslint-disable no-console */
function pad(num, size) {
    let s = `${num}`;
    while (s.length < size) s = `0${s}`;

    return s;
}

function log(num, base) {
    return Math.log(num) / Math.log(base);
}

function roundLog(num, base) {
    return Math.ceil(log(num, base));
}

function nameOpCodes(raw, opcodes) {
    let pushData;
    const infoFull = [];

    for (let i = 0; i < raw.length; i++) {
        const pc = i;
        const tmpOpcode = opcodes.get(raw[pc]);
        const curOpCode = (typeof tmpOpcode === 'undefined' || tmpOpcode === null) ? undefined : tmpOpcode.name;

        // no destinations into the middle of PUSH
        if (curOpCode?.slice(0, 4) === 'PUSH') {
            const jumpNum = raw[pc] - 0x5f;
            pushData = raw.slice(pc + 1, pc + jumpNum + 1);
            i += jumpNum;
        }
        const info = `${pad(pc, roundLog(raw.length, 10))}  ${curOpCode} ${pushData?.toString('hex')}`;
        console.log(info);
        infoFull.push(info);

        pushData = '';
    }

    return infoFull;
}

module.exports = {
    pad,
    log,
    roundLog,
    nameOpCodes,
};
