# Plot the Averaged mean response time, confronting three Nginx policies in the same graph
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from influxdb_client import InfluxDBClient

from steady_state_response_time import (compute_mrt_for_simulation,
                                        get_simulation_id)

client = InfluxDBClient(url="http://localhost:8086",
                        token="my-token", org="BBM SpA")
query_api = client.query_api()

if __name__ == "__main__":

    sim = get_simulation_id()

    policies = ['round-robin', 'random', 'least-connected']
    results = pd.DataFrame()

    for i in range(0, 3):
        sim_id = sim - i
        print(f'Analyzing simulation {sim_id}')

        query = ('import "experimental"'
                 'from(bucket:"k6")'
                 '|> range(start: -1y)'
                 f'|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "{sim_id}")'
                 '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                 '|> timedMovingAverage(every: 500ms, period: 500ms)'
                 '|> sort(columns: ["_time"], desc: false)')

        query_results = query_api.query_data_frame(query)

        avg_request_time = pd.DataFrame(query_results[['_value', '_time']])
        starting_time = min(avg_request_time['_time'])
        avg_request_time = avg_request_time.apply(
            lambda x: [x['_value'], x['_time'] - starting_time], axis=1, result_type='expand')
        avg_request_time.rename(columns={0: policies[i], 1: "time"}, inplace=True)
        avg_request_time.set_index('time', inplace=True)

        results = results.join(avg_request_time, how="outer")

    results.reset_index(inplace=True)
    results["seconds"] = results["time"].dt.total_seconds()
    ax_rr = results.plot.scatter(x='seconds', y="round-robin", color="red", label='round-robin')
    ax_random = results.plot.scatter(x='seconds', y="random", ax=ax_rr, color="blue", label='random')
    ax_least_conn = results.plot.scatter(x='seconds', y="least-connected", ax=ax_rr, color="green", label='least-connected')

    plt.ylabel('Response time (ms)')
    plt.title("Average request time.")
    plt.legend()
    plt.grid(True)
    plt.show()
