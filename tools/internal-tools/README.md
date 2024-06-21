# FLOW TO GENERATE VC (CARDONA)
## get-input.js
To generate input. Example:

```
node get-input.js --network cardona --blockNum 393833
```

## generate fulltracer info
Generate traces. Example:

```
node src/main_executor.js ../../inputs-executor/cardona/block-383933.json -r ../../etrog/zkevm-rom/build/rom.json -P ./pil-config.json -N 8388608 -d -V verbose-config.json -s -B "postgresql://.../zkevmtestnetplessdbhash" -T -a false
```

With verbose-config:
```
{
    "fullTracer": {
        "initFinalState": true,
        "saveInitFinalState": true,
        .........
    },
    ...
}
```

## get-info.js
Get info from traces. Example:

```
node get-info.js --input ./blocks/block-383933.json
```

Update counter filter in file:

```
const counterToFilter = 'cnt_poseidon_g';
```

## gen-vc-testvector.js
Get testvector. initFinalSTate & saveInitFinalState are needed. Example:

```
node gen-vc-testvector.js --blockNum 383933
```

## pass test-vector calldata-gen-input with --evm-debug

```
npx mocha --max-old-space-size=4096 calldata-gen-inputs.js --timeout 0 --vectors block-383933-testvector.json --output --update --nointernal --countersteps --cardona
```
or
```
./run-vc-testvector.sh
```

## get-info-vc.js
Get info from `evm-stack-logs`. Example:

```
node get-info-vc.js --input ../../tools-inputs/generators/evm-stack-logs/block-383933-testvector-0.json
```