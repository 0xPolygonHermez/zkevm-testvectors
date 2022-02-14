const Scalar = require("ffjavascript").Scalar;

function stringToHex32(value, leftAppend = false) {
    const aux = Scalar.e(value).toString(16).padStart(64, '0');
    return leftAppend ? `0x${aux}` : aux;
}

async function getSMT(root, db, F) {
    const smt = await _getSMT(root, db, F, {});
    //Reverse json object to have root at the top
    const arr = Object.keys(smt).map((key) => [key, smt[key]]);
    return arr.reverse().reduce((acc, curr) => {
        acc[curr[0]] = curr[1];
        return acc;
      }, {})
}

async function _getSMT(root, db, F, res = {}) {

    const sibilings = await db.getSmtNode(root);
    const value = [];
    //Reversed to have the root as the first key
    for(const  val of sibilings) {
        value.push(F.toString(val, 16).padStart(64, "0"));
        if(F.eq(sibilings[0], F.one) || F.isZero(val)) {
            continue;
        }
        await _getSMT(val, db, F, res);
    }

    res[F.toString(root, 16).padStart(64, "0")] = value;
    return res;
}

module.exports = {
    stringToHex32,
    getSMT
}