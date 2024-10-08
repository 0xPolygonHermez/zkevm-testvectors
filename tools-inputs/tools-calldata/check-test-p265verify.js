const fs = require("fs");
const tests = require("./test-p256verify.json");
const genTests = require("./generate-test-vectors/gen-pre-rip7212.json")

function main() {
    for(let i = 0; i < tests.length; i++) {
      const test = Number(tests[i].Expected);
      const genTest = Number(genTests[i].expectedNewLeafs["0x1275fbb540c8efc58b812ba83b0d0b8b9917ae98"].storage["0x0000000000000000000000000000000000000000000000000000000000000001"]); 
      if(test === 0 && genTest === 1) {
        throw new Error(`test ${i} expected result !== result`)
      } else if(test === 1 && test !== genTest) {
        throw new Error(`test ${i} expected result !== result`)
      }
    }
}

main()