# Simulations notes
The file for taking down some observations wrt simulations.

## Configuration 1

- **Round robin** policy (default) ✅
```
NUM_SERVERS=10 MIN_RESPONSE_TIME=100 K6_ITERATIONS=100000 K6_VUS=100 LAMBDA=0.01 K6_RPS=300 npm run simulation
```

- **Random** policy ✅
```
NUM_SERVERS=10 MIN_RESPONSE_TIME=100 K6_ITERATIONS=100000 K6_VUS=100 LAMBDA=0.01 K6_RPS=300 LOAD_BALANCING=random npm run simulation
```

- **Least connected** policy ✅
```
NUM_SERVERS=10 MIN_RESPONSE_TIME=100 K6_ITERATIONS=100000 K6_VUS=100 LAMBDA=0.01 K6_RPS=300 LOAD_BALANCING=least_conn npm run simulation
```

This configuration causes correlation among the samples. The reason lays in the number of requests per second which is
outrageously high.

## Configuration 2
```
NUM_SERVERS=2 MIN_RESPONSE_TIME=100 EXP_RESPONSE_TIME=true K6_ITERATIONS=10000 K6_VUS=100 LAMBDA=0.01 SEED=10 K6_RPS=100 npm run simulation
```

In this configuration, instead, samples are not correlated.
Adding more servers does not have any relevant effect on the results.


## Configuration autoscaling

```bash
AUTOSCALE=true NUM_SERVERS=1 MIN_RESPONSE_TIME=100 EXP_RESPONSE_TIME=true K6_ITERATIONS=10000 K6_VUS=100 LAMBDA=0.01 SEED=10 K6_RPS=100 npm run simulation
```

## Configuration 3
```
NUM_SERVERS=1 MIN_RESPONSE_TIME=100 EXP_RESPONSE_TIME=true SEED=10 LAMBDA=0.01 K6_RPS=100 SIMULATE_SERVER_LOAD=true K6_ITERATIONS=100000 K6_VUS=100 AUTOSCALE=true npm run simulation
```