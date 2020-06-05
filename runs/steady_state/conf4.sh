#!/bin/bash

export SEED=1000000000

export NUM_SERVERS=1
export MIN_RESPONSE_TIME=500
export EXP_RESPONSE_TIME=true
export K6_ITERATIONS=40000
export K6_VUS=300
export LAMBDA=0.01
export K6_RPS=100
export SIMULATE_SERVER_LOAD=true

export AUTOSCALE=true
export AUTOSCALE_INCREASE_THRESHOLD=10
export AUTOSCALE_DECREASE_THRESHOLD=5
export AUTOSCALE_POLICY=REQUESTS_PER_SECOND
export AUTOSCALE_LOOKUP_INTERVAL=20000
export AUTOSCALE_ALGORITHM_INTERVAL=1000

echo "Starting round-robin"
npm run simulation
sleep 5

export LOAD_BALANCING=least_conn
echo "Starting $LOAD_BALANCING"
npm run simulation
sleep 5

export LOAD_BALANCING=random
echo "Starting $LOAD_BALANCING"
npm run simulation
sleep 5
