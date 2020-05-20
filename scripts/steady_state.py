import math
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from influxdb_client import Dialect, InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from matplotlib import pyplot as plt
from scipy.stats import t

NUM_BATCH = 50
CI_LEVEL = 0.05

SIMULATION_ID_FILE = "build/simulation.txt"

if not os.environ.get("SIMULATION"):
    # Read the ID of the simulation from the file
    simulation_file = open(SIMULATION_ID_FILE, "r")
    SIMULATION_ID = simulation_file.read()
else:
    SIMULATION_ID = os.environ.get("SIMULATION")

print(f'Analyzing simulation {SIMULATION_ID}')
client = InfluxDBClient(url="http://localhost:8086",
                        token="my-token", org="BBM SpA")

query_api = client.query_api()

query_result = query_api.query_data_frame('import "experimental"'
                                          'from(bucket:"k6") '
                                          '|> range(start: -1y)'
                                          f'|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.simulation == "{SIMULATION_ID}")'
                                          '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                                          '|> sort(columns: ["_time"], desc: false)'
                                          )

values = query_result['_value']

# Plot sample ACF
# ax = pd.plotting.autocorrelation_plot(values)
# ax.set_xlim([0, 1000])
# plt.show()

durations = values.to_numpy()
batches = np.split(durations, 50)

batches_mean = [np.mean(b) for b in batches]
grand_batches_mean = np.mean(batches_mean)

batches_mean_est = sum(
    [(b - grand_batches_mean)**2 for b in batches_mean]) / (NUM_BATCH - 1)

t_quantile = t.ppf(1 - CI_LEVEL, df=NUM_BATCH - 1)
ci_min = grand_batches_mean - \
    (t_quantile * math.sqrt(batches_mean_est / NUM_BATCH))
ci_max = grand_batches_mean + \
    (t_quantile * math.sqrt(batches_mean_est / NUM_BATCH))

print(f'CI for mean: [{ci_min}, {ci_max}].')
