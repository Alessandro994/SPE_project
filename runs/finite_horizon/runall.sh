#!/bin/bash

set -e

export REPLICATIONS=10

./runs/finite_horizon/requests_per_second/conf5.sh
./runs/finite_horizon/requests_per_second/conf6.sh
./runs/finite_horizon/requests_per_second/conf7.sh

./runs/finite_horizon/response_time/conf8.sh
./runs/finite_horizon/response_time/conf9.sh
./runs/finite_horizon/response_time/conf10.sh