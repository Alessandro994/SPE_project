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
         '|> aggregateWindow(every: 500ms, fn: count, createEmpty: false)'
         '|> map(fn: (r) => ({ r with _value: int(v: r._value) }))')


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
                 f'|> filter(fn: (r) => r._measurement == "response_time" and r._field == "value" and r.simulation == "{sim_id}")'
                 '|> group(columns: ["measurement"])'
                 '|> aggregateWindow(every: 500ms, fn: distinct, column: "server_id", createEmpty: false)'
                 '|> aggregateWindow(every: 500ms, fn: count, createEmpty: false)'
                 '|> map(fn: (r) => ({ r with _value: int(v: r._value) }))')

        query_results = query_api.query_data_frame(query)

        num_servers = pd.DataFrame(query_results[['_value', '_time']])
        starting_time = min(num_servers['_time'])
        num_servers = num_servers.apply(lambda x: [x['_value'],  x['_time']-starting_time], axis=1, result_type='expand')
        num_servers.rename(columns={0: policies[i], 1: "time"}, inplace=True)
        num_servers.set_index('time', inplace=True)

        results = results.join(num_servers, how="outer")

    results.plot()
    plt.title("Number of servers over time")
    plt.grid(True)
    plt.show()

