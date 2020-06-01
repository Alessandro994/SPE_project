# Plot the Averaged mean response time, confronting three Nginx policies in the same graph
import matplotlib.pyplot as plt
import numpy as np
from influxdb_client import InfluxDBClient
import pandas as pd

from steady_state_response_time import (compute_mrt_for_simulation,
                                        get_simulation_id)


client = InfluxDBClient(url="http://localhost:8086", token="my-token", org="BBM SpA")
query_api = client.query_api()

query = ('import "experimental"'
         'from(bucket:"k6")'
         '|> range(start: -1y)'
         '|> filter(fn: (r) => r._measurement == "response_time" and r._field == "value" and r.simulation == "89")'
         '|> group(columns: ["measurement"])'
         '|> aggregateWindow(every: 500ms, fn: distinct, column: "server_id", createEmpty: false)'
         '|> map(fn: (r) => ({ r with _value: int(v: r._value) }))')


if __name__ == "__main__":

    sim = get_simulation_id()
    query_results = query_api.query_data_frame(query)

    num_servers = pd.DataFrame(query_results[['_value', '_time']])

    num_servers.rename(columns={'_value': 'value'}, inplace=True)
    num_servers.set_index('_time', inplace=True)

    num_servers.plot()
    plt.show()
    policies = ['round-robin', 'random', 'least-connected']
    averages_response_time = []
    ci_intervals = []

    # for i in range(0, 3):
        # sim_id = sim - i
        # print(f'Analyzing simulation {sim_id}')
        #
        # response_time = compute_mrt_for_simulation(
        #     sim_id, autocorrelation_plot=False)
        # averages_response_time.append(response_time.mean)
        # ci_intervals.append(response_time.ci_interval)

    # plt.errorbar(
    #     x=policies,
    #     y=averages_response_time,
    #     yerr=ci_intervals,
    #     # Disable line between x data points
    #     ls='None',
    #     fmt='_',
    #     lolims=True,
    #     uplims=True,
    # )
    # plt.title('Average response time per policy')
    # plt.xlabel('Load balancing policy')
    # plt.ylabel('Average response time (ms)')
    # plt.grid(True)
    #
    # plt.ylim(bottom=MIN_Y, top=max(averages_response_time) * 1.005)
    # plt.show()
