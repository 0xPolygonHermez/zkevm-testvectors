#!/bin/sh
N=6 # Set here total amount of configs
for i in $(seq $N); do
    id=$(expr $i - 1)
    node benchmark.js --config_id $id
done