const fs = require("fs");
const tests = require("./test-p256verify.json");

function main() {
    const genTests = [];
    for(let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const objTest = {
            "id": i,
            "description": `precompiled rip7212 test ${i} from https://github.com/ulerdogan/go-ethereum/blob/ulerdogan-secp256r1/core/vm/testdata/precompiles/p256Verify.json`,
            "sequencerAddress": "0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D",
            "sequencerPvtKey": "0x28b2b0318721be8c8339199172cd7cc8f5e273800a35616ec893083a4b32c02e",
            "genesis": {
              "accounts": [
                {
                  "address": "0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D",
                  "pvtKey": "0x28b2b0318721be8c8339199172cd7cc8f5e273800a35616ec893083a4b32c02e",
                  "balance": "100000000000000000000",
                  "nonce": "0"
                },
                {
                  "address": "0x4d5Cf5032B2a844602278b01199ED191A86c93ff",
                  "pvtKey": "0x4d27a600dce8c29b7bd080e29a26972377dbb04d7a27d919adbb602bf13cfd23",
                  "balance": "200000000000000000000",
                  "nonce": "0"
                }
              ],
              "contracts": [
                {
                  "contractName": "PreRip7212",
                  "paramsDeploy": {}
                }
              ]
            },
            "expectedOldRoot": "0xa46136c776183e59dfb8fdfcf26a69ddb564dd56fe5eaa8dc2c6145baf0372de",
            "txs": [
              {
                "type": 11,
                "deltaTimestamp": 1944498031,
                "l1Info": {
                  "globalExitRoot": "0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9",
                  "blockHash": "0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb",
                  "timestamp": "42"
                },
                "indexL1InfoTree": 0
              },
              {
                "from": "0x4d5Cf5032B2a844602278b01199ED191A86c93ff",
                "to": "contract",
                "nonce": "0",
                "value": "0",
                "contractName": "PreRip7212",
                "function": "p256verify",
                "params": [
                  `0x${test.Input.slice(0,64)}`,
                  `0x${test.Input.slice(64,128)}`,
                  `0x${test.Input.slice(128,192)}`,
                  `0x${test.Input.slice(192,256)}`,
                  `0x${test.Input.slice(256,320)}`
                ],
                "gasLimit": 100000,
                "gasPrice": "1000000000",
                "chainId": 1000
              }
            ],
            "expectedNewRoot": "0xdb5e50104db9546711f75267495789af837a5c54f17bb80a766acb71c60f5c74",
            "expectedNewLeafs": {
              "0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D": {
                "balance": "100000050465000000000",
                "nonce": "0",
                "storage": null
              },
              "0x4d5Cf5032B2a844602278b01199ED191A86c93ff": {
                "balance": "199999949535000000000",
                "nonce": "1",
                "storage": null
              },
              "0x1275fbb540c8efc58b812ba83b0d0b8b9917ae98": {
                "balance": "0",
                "nonce": "1",
                "storage": {
                  "0x0000000000000000000000000000000000000000000000000000000000000001": "0xbb5a52f42f9c9261ed4361f59422a1e30036e7c32b270c8807a419feca605023"
                },
                "hashBytecode": "0xa8928873f15be03ccce34cb3f1ee43b86228aa2dc21736735d99c8c54a129563",
                "bytecodeLength": 375
              },
              "0x000000000000000000000000000000005ca1ab1e": {
                "balance": "0",
                "nonce": "0",
                "storage": {
                  "0x0000000000000000000000000000000000000000000000000000000000000000": "0x01",
                  "0x0000000000000000000000000000000000000000000000000000000000000002": "0x73e6af6f",
                  "0xa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb49": "0xa46136c776183e59dfb8fdfcf26a69ddb564dd56fe5eaa8dc2c6145baf0372de",
                  "0x0000000000000000000000000000000000000000000000000000000000000003": "0x93e105c1cff1a344001e3cbbae6d7a6040aff349d170a21fe51a6c4595b7e983"
                }
              }
            },
            "newLocalExitRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "batchHashData": "0x3dbedc755794b4e3c321aece7975af73c35e74d83b6bf42c6ac051191b2ac223",
            "batchL2Data": "0x0b73e6af6f00000000f8cb80843b9aca00830186a0941275fbb540c8efc58b812ba83b0d0b8b9917ae9880b8a462d14a79bb5a52f42f9c9261ed4361f59422a1e30036e7c32b270c8807a419feca6050232ba3a8be6b94d5ec80a6d9d1190a436effe50d85a1eee859b8cc6af9bd5c2e184cd60b855d442f5b3c7b11eb6c4e0ae7525fe710fab9aa7c77a67f79e6fadd762927b10512bae3eddcfe467828128bad2903269919f7086069c8c4df6c732838c7787964eaac00e5921fb1498a60f4606766b3d9685001558d1a974e7341513e8203e88080b556301ee37b626b831772c15f9c611e5ee437abce3f84dbb7e867a3bc961f7d323e9f6ae3c56e4a7b609933531abcc048133bb1b81071a06d881a9f504301d71cff",
            "chainID": 1000,
            "oldAccInputHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "forkID": 13,
            "l1InfoRoot": "0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9",
            "timestampLimit": "1944498031"
        }
        genTests.push(objTest)
    }
    fs.writeFileSync("./generate-test-vectors/gen-pre-rip7212.json", JSON.stringify(genTests, null, 2))
}

main()