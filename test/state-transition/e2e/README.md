# Additional test information
`e2e` test aims to check two functionalities related to the `zkEVMBridge` and creates its inputs:
- `claimAsset`
- `bridgeAsset`

## Notes
- `e2e.json` is taken from [zkevm-commonjs](https://github.com/0xPolygonHermez/zkevm-commonjs/blob/develop/test/helpers/test-vectors/end-to-end/state-transition.json)
- state-transition test is inside an array in `zkevm-commonjs`, make sure to delete the array when importing into `zkevm-testvectors`