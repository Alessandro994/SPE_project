#!/bin/bash
set -e

REPLICATIONS=${REPLICATIONS:-5}
echo "Execute $REPLICATIONS replications with least-connected policy"

export NUM_SERVERS=1
export MIN_RESPONSE_TIME=500
export EXP_RESPONSE_TIME=true
export K6_ITERATIONS=10000
export K6_VUS=300
export LAMBDA=0.01
export K6_RPS=100
export SIMULATE_SERVER_LOAD=true

export LOAD_BALANCING=least_conn

export AUTOSCALE=true
export AUTOSCALE_POLICY=RESPONSE_TIME
export AUTOSCALE_INCREASE_THRESHOLD=1000
export AUTOSCALE_DECREASE_THRESHOLD=800
export AUTOSCALE_LOOKUP_INTERVAL=20000
export AUTOSCALE_ALGORITHM_INTERVAL=1000

counter=0

while [ $counter -lt "$REPLICATIONS" ]; do
  echo "Replication no. $counter"
  export SEED=$((1000000000 + counter))
  npm run simulation
  sleep 5
  counter=$((counter+1))
done
