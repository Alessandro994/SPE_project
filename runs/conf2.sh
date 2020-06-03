#!/bin/bash

export SEED=1000000000

export NUM_SERVERS=10
export MIN_RESPONSE_TIME=500
export EXP_RESPONSE_TIME=true
export K6_ITERATIONS=40000
export K6_VUS=300
export LAMBDA=0.01
export K6_RPS=100

export LOAD_BALANCING=least_conn
echo "Starting $LOAD_BALANCING"
npm run simulation
sleep 5

export LOAD_BALANCING=random
echo "Starting $LOAD_BALANCING"
npm run simulation
sleep 5

unset LOAD_BALANCING
echo "Starting round-robin"
npm run simulation
sleep 5
