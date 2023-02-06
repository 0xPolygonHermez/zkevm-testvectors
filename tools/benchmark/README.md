How to check benchmarking from a calldata test:

0 -
`````
cp benchmark_config.json.example benchmark_config.json
`````
1 - Fill `benchmark_config.json`:

`````

    {
        "id": 0, // numeric identifier
        "name": "Balance transfer", // Description of the test
        "testPath": "../../state-transition/no-data/balances.json", // path of the calldata tetstt
        "setupTxs": [], // Index of the txs you need to run before running txs to benchmark
        "iterateTxs": [0], // index of transactions to benchamrk.
        "testIndex": 5, // Index of the test you want to run from the calldata test
        "initStep": 121, // Number of start iterations
        "testStep": 1 // Txs increment between iterations
        "additionalGenesisAccountsFactor": 2 // power of two of number of prefilled accounts to add to genesis before benchmarking
        "benchmar": {} // No need to touch, is the result of the benchmark
    }
`````
Explanation: the above config will run the 5th test of the calldata test in balances.json. Will start running batches with 121 txs and will increase 1 more tx for each iteration (until it gets an error)

Example 2:
`````
  {
        "id": 3,
        "name": "Uniswap swaps",
        "testPath": "../../state-transition/calldata/uniswapv2-benchmark.json",
        "setupTxs": [0,1,2,3,4,5,6],
        "iterateTxs": [7,8],
        "testIndex": 0,
        "initStep": 21,
        "testStep": 1
    }
`````
Explanation: the above config will run the first test of uniswapv2-benchmark.json calldata test. Before iterating, it will execute a batch with txs 0-6, after consolidating this setup batch, it will start iterating creating batches of 21 groups with txs 7 and 8 in each group (42 txs at the first batch). It will increment the number of groups per batch by 1 for each iteration.

2 - Set benchmark config:
`````
const CONFIG_ID = 0; // Set config id here
const compilePil = false; // Put on true if you want to compile pil without seting stepsN
`````
3 - Run script
`````
node benchmark.js
`````
