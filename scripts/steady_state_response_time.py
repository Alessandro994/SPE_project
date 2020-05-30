import math
import os

import numpy as np
import pandas as pd
from influxdb_client import InfluxDBClient
from matplotlib import pyplot as plt
from scipy.stats import t

from DataObjects.MeanResponseTime import MeanResponseTime

NUM_BATCH = 64
CI_LEVEL = 0.05

SIMULATION_ID_FILE = "build/simulation.txt"


def compute_mrt_for_simulation(simulation_id: str) -> MeanResponseTime:
    client = InfluxDBClient(url="http://localhost:8086",
                            token="my-token", org="BBM SpA")

    query_api = client.query_api()

    requests_duration = query_api.query_data_frame('import "experimental"'
                                                   'from(bucket:"k6") '
                                                   '|> range(start: -1y)'
                                                   f'|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "{simulation_id}")'
                                                   '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                                                   '|> sort(columns: ["_time"], desc: false)'
                                                   )

    values = requests_duration['_value']

    # Plot sample ACF
    plot_sample_autocorrelation(values, simulation_id)

    durations = values.to_numpy()
    print(f'Initial number of samples: {len(durations)}.')

    modulo = len(durations) % NUM_BATCH

    # If the samples are not a multiple of the number of batches
    # remove a number of initial samples corresponding to the modulo.
    if modulo != 0:
        durations = durations[modulo:]
        print(f'Removing {modulo} samples to get an equal number of samples in each batch.')

    batches = np.split(durations, NUM_BATCH)

    batches_mean = [np.mean(b) for b in batches]
    grand_batches_mean = np.mean(batches_mean)

    batches_mean_est = sum(
        [(b - grand_batches_mean) ** 2 for b in batches_mean]) / (NUM_BATCH - 1)

    t_quantile = t.ppf(1 - CI_LEVEL, df=NUM_BATCH - 1)
    ci_min = grand_batches_mean - \
             (t_quantile * math.sqrt(batches_mean_est / NUM_BATCH))
    ci_max = grand_batches_mean + \
             (t_quantile * math.sqrt(batches_mean_est / NUM_BATCH))

    mrt = MeanResponseTime(grand_batches_mean, ci_min, ci_max)
    print(mrt)
    return mrt


def plot_sample_autocorrelation(values: pd.DataFrame, simulation_id: str):
    # Plot sample ACF
    ax = pd.plotting.autocorrelation_plot(values)
    ax.set_xlim([0, 1000])
    plt.title(f'Sample ACF for simulation {simulation_id}')
    txt = "I need the caption to be present a little below X-axis"
    plt.figtext(0.5, 0.01, txt, wrap=True, horizontalalignment='center', fontsize=12)
    plt.show()


def get_simulation_id() -> str:
    if not os.environ.get("SIMULATION"):
        # Read the ID of the simulation from the file
        simulation_file = open(SIMULATION_ID_FILE, "r")
        simulation_id = simulation_file.read()
    else:
        simulation_id = os.environ.get("SIMULATION")

    return simulation_id


if __name__ == "__main__":
    sim = get_simulation_id()
    print(f'Analyzing simulation {sim}')

    compute_mrt_for_simulation(sim)
