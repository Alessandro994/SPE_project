#!/bin/bash

# Execute 5 replications with random least-connected policy (same seed per replication).

export SEED=1000000000

export NUM_SERVERS=1
export MIN_RESPONSE_TIME=500
export EXP_RESPONSE_TIME=true
export K6_ITERATIONS=10000
export K6_VUS=300
export LAMBDA=0.01
export K6_RPS=100
export AUTOSCALE=true
export SIMULATE_SERVER_LOAD=true

counter=0
replications=5

while [ $counter -lt $replications ]; do
  echo "Replication no. $counter"
  npm run simulation
  sleep 5
  ((counter++))
done