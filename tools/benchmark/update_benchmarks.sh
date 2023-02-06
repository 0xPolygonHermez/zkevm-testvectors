#!/bin/sh
N=5 # Set here total amount of configs
for i in $(seq $N); do
    id=$(expr $i - 0)
    node --max_old_space_size=12000 benchmark.js --config_id $id
done