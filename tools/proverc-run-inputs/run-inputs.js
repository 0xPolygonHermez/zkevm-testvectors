/* eslint-disable no-use-before-define */
/* eslint-disable no-new */
const grpc = require('@grpc/grpc-js');
const path = require('path');

const PROTO_PATH = `${__dirname}/executor.proto`;
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const zkProverProto = grpc.loadPackageDefinition(packageDefinition).executor.v1;
const { ExecutorService } = zkProverProto;

async function runInputs() {
    const client = new ExecutorService('localhost:50071', grpc.credentials.createInsecure());
    const batch = {
        batch_num: 1,
        coinbase: '0x617b3a3528F9cDd6630fd3301B9c8911F7Bf063D',
        batch_l2_data: '0xee80843b9aca00830186a0944d5cf5032b2a844602278b01199ed191a86c93ff88016345785d8a0000808203e880801cee7e01dc62f69a12c3510c6d64de04ee6346d84b6a017f3e786c7d87f963e75d8cc91fa983cd6d9cf55fff80d73bd26cd333b0f098acc1e58edb1fd484ad731bef80843b9aca00830186a0944d5cf5032b2a844602278b01199ed191a86c93ff893635c9adc5dea00000808203e880800d7790e34c262fc9bca95e5c9f8f7ae1625e1338580eb0a0e707dcb76fef0b64385c32f57ec5f520129252ed65f226c6cb50fa16fc07f1e45a9054797f1b462b1c',
        old_state_root: '0x76b362a9afd679ea13a456ab103786492c65946be653589c1fd627841d0c6fdd',
        global_exit_root: '0x090bcaf734c4f06c93954a827b45a6e8c67b8e0fd1e0a35a1c5982d6961828f9',
        old_local_exit_root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        eth_timestamp: 1944498031,
        update_merkle_tree: 0,
        tx_hash_to_generate_execute_trace: 0,
        tx_hash_to_generate_call_trace: 0,
    };
    const as = await client.ProcessBatch(batch, ProcessBatchCallback);
    console.log('A');
    // const point = { latitude: 409146138, longitude: -746188906 };
    // stub.getFeature(point, function (err, feature) {
    //     if (err) {
    //         // process error
    //     } else {
    //         // process feature
    //     }
    // });
}

function ProcessBatchCallback(error, feature) {
    if (error) {
        console.log('ERR: ', error);
        return;
    }
    console.log('GO');
}

runInputs();
