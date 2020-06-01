#!/bin/bash

export SEED=1000000000
export LOAD_BALANCING=least_conn
echo "Starting $LOAD_BALANCING"
NUM_SERVERS=1 MIN_RESPONSE_TIME=500 EXP_RESPONSE_TIME=true K6_ITERATIONS=100000 K6_VUS=300 LAMBDA=0.01 K6_RPS=100 AUTOSCALE=true npm run simulation
sleep 5

export LOAD_BALANCING=random
echo "Starting $LOAD_BALANCING"
NUM_SERVERS=1 MIN_RESPONSE_TIME=500 EXP_RESPONSE_TIME=true K6_ITERATIONS=100000 K6_VUS=300 LAMBDA=0.01 K6_RPS=100 AUTOSCALE=true npm run simulation
sleep 5

unset LOAD_BALANCING
echo "Starting round-robin"
NUM_SERVERS=1 MIN_RESPONSE_TIME=500 EXP_RESPONSE_TIME=true K6_ITERATIONS=100000 K6_VUS=300 LAMBDA=0.01 K6_RPS=100 AUTOSCALE=true npm run simulation
sleep 5
