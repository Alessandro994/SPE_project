import math

import numpy as np
import pandas as pd
from influxdb_client import InfluxDBClient
from matplotlib import pyplot as plt
from scipy.stats import t

from DataObjects.MeanResponseTime import MeanResponseTime
from get_simulation_id import get_simulation_id

NUM_BATCH = 64
CI_LEVEL = 0.05

def compute_mrt_for_simulation_ss(simulation_id: int, autocorrelation_plot=True) -> MeanResponseTime:
    client = InfluxDBClient(url="http://localhost:8086", token="my-token", org="BBM SpA")
    query_api = client.query_api()

    requests_duration = query_api.query_data_frame('import "experimental"'
                                                   'from(bucket:"k6") '
                                                   '|> range(start: -1y)'
                                                   f'|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "{simulation_id}")'
                                                   '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                                                   '|> sort(columns: ["_time"], desc: false)'
                                                   )
    values = requests_duration['_value']

    if autocorrelation_plot:
        # Plot sample ACF
        plot_sample_autocorrelation(values, simulation_id)

    durations = values.to_numpy()
    print(f'Initial number of samples: {len(durations)}.')

    modulo = len(durations) % NUM_BATCH

    # If the samples are not a multiple of the number of batches
    # remove a number of initial samples corresponding to the modulo.
    if modulo != 0:
        durations = durations[modulo:]
        print(
            f'Removing {modulo} samples to get an equal number of samples in each batch ({len(durations) / NUM_BATCH}).')

    batches = np.split(durations, NUM_BATCH)

    batches_mean = [np.mean(b) for b in batches]
    grand_batches_mean = np.mean(batches_mean)

    batches_mean_est = sum(
        [(b - grand_batches_mean) ** 2 for b in batches_mean]) / (NUM_BATCH - 1)

    t_quantile = t.ppf(1 - CI_LEVEL, df=NUM_BATCH - 1)
    ci_interval = (t_quantile * math.sqrt(batches_mean_est / NUM_BATCH))

    ci_min = grand_batches_mean - ci_interval
    ci_max = grand_batches_mean + ci_interval

    mrt = MeanResponseTime(grand_batches_mean, ci_min, ci_max, ci_interval)
    print(mrt)
    return mrt


def plot_sample_autocorrelation(values: pd.DataFrame, simulation_id: int):
    # Plot sample ACF
    ax = pd.plotting.autocorrelation_plot(values)
    ax.set_xlim([0, 100000])
    plt.title(f'Sample ACF for simulation {simulation_id}')
    plt.show()


if __name__ == "__main__":
    sim = get_simulation_id()
    print(f'Analyzing simulation {sim}')

    compute_mrt_for_simulation_ss(sim)
