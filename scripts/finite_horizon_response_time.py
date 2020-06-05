import math

import numpy as np
from influxdb_client import InfluxDBClient
from scipy.stats import t

from DataObjects.MeanResponseTime import MeanResponseTime
from get_simulation_id import get_simulation_id

CI_LEVEL = 0.05
REPLICATIONS_NUM = 5


def compute_mrt_for_simulation_fh(simulation_id: int) -> MeanResponseTime:
    client = InfluxDBClient(url="http://localhost:8086", token="my-token", org="BBM SpA")
    query_api = client.query_api()

    replications_mean = []

    assert REPLICATIONS_NUM > 0, 'Replications should be greater than 0.'
    for i in range(REPLICATIONS_NUM, 0, -1):
        sim_id = simulation_id - i + 1
        print(f'Analyzing simulation {sim_id}')

        query = query_api.query_data_frame('import "experimental"'
                                           'from(bucket:"k6") '
                                           '|> range(start: -1y)'
                                           f'|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "{sim_id}")'
                                           '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                                           '|> sort(columns: ["_time"], desc: false)'
                                           )

        # extract the series with the request duration values
        req_durations = query['_value']

        # store the mean of this series
        replications_mean.append(req_durations.mean())

    # the grand mean is the mean of means of each replication
    grand_replications_mean = np.mean(replications_mean)

    replications_mean_est = sum(
        [(b - grand_replications_mean) ** 2 for b in replications_mean]) / (REPLICATIONS_NUM - 1)

    t_quantile = t.ppf(1 - CI_LEVEL, df=REPLICATIONS_NUM - 1)
    ci_interval_half_width = (t_quantile * math.sqrt(replications_mean_est / REPLICATIONS_NUM))

    ci_min = grand_replications_mean - ci_interval_half_width
    ci_max = grand_replications_mean + ci_interval_half_width

    mrt = MeanResponseTime(grand_replications_mean, ci_min, ci_max, ci_interval_half_width)
    print(mrt)
    return mrt


if __name__ == "__main__":
    sim = get_simulation_id()

    print(f'Starting from simulation {sim}')
    compute_mrt_for_simulation_fh(sim)
