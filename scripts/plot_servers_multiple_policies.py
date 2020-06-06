# Plot the Averaged mean response time, confronting three Nginx policies in the same graph
import matplotlib.pyplot as plt
import numpy as np
from influxdb_client import InfluxDBClient
import pandas as pd

from steady_state_response_time import get_simulation_id

RANGE = 10
AGGREGATE_DELTA = "4s"
policies = ['round-robin', 'random', 'least-connected']

client = InfluxDBClient(url="http://localhost:8086", token="my-token", org="BBM SpA")
query_api = client.query_api()


# Get the number of servers over time
def get_num_servers(sim_id: int, iteration: int):
    query = ('import "experimental"'
             'from(bucket:"k6")'
             '|> range(start: -1y)'
             f'|> filter(fn: (r) => r._measurement == "response_time" and r._field == "value" and r.simulation == "{sim_id}")'
             '|> group(columns: ["measurement"])'
             f'|> aggregateWindow(every: {AGGREGATE_DELTA}, fn: distinct, column: "server_id", createEmpty: false)'
             f'|> aggregateWindow(every: {AGGREGATE_DELTA}, fn: count, createEmpty: false)'
             '|> map(fn: (r) => ({ r with _value: int(v: r._value) }))')

    query_results = query_api.query_data_frame(query)

    num_servers = pd.DataFrame(query_results[['_value', '_time']])
    starting_time = min(num_servers['_time'])
    num_servers = num_servers.apply(lambda x: [x['_value'], x['_time'] - starting_time], axis=1, result_type='expand')
    num_servers.rename(columns={0: iteration, 1: "time"}, inplace=True)
    num_servers.set_index('time', inplace=True)

    return num_servers


# Get the confidence interval given a policy
def get_confidence_intervals_policy(starting_sim):

    eta = 2.62

    results = pd.DataFrame()

    for i in range(0, RANGE):
        sim_id = starting_sim - i
        print(f'Analyzing simulation {sim_id}')

        num_servers = get_num_servers(sim_id, i+1)

        results = results.join(num_servers, how="outer")

    means = results.mean(axis=1)
    variances = results.var(axis=1)

    confidence_interval_widths = variances.divide(RANGE).pow(1/2).multiply(eta)

    # plt.errorbar(
    #     x=results.reset_index()['time'].dt.seconds,
    #     y=means,
    #     yerr=confidence_interval_widths,
    #     # Disable line between x data points
    #     # ls='None',
    #     # fmt='_',
    #     lolims=True,
    #     uplims=True,
    # )
    # plt.title(f"Number of server over time (sim {starting_simulation_id})")
    # plt.grid(True)
    # plt.xlabel("Time (s)")
    # plt.ylabel("# servers")
    # plt.show()

    return means, confidence_interval_widths


# Plot all the error bars for all the policies on the same graph
def plot_error_bar_all_policies():
    for i in range(len(policies)):
        means, confidence_intervals = get_confidence_intervals_policy(get_simulation_id() - i * RANGE)

        plt.errorbar(
            x=means.reset_index()['time'].dt.seconds,
            y=means,
            yerr=confidence_intervals,
            # Disable line between x data points
            linestyle='dashed',
            # fmt='_',
            lolims=True,
            uplims=True,
            capthick=0.1,
            label=policies[i]
        )

    plt.title(f"Number of server over time")
    plt.grid(True)
    plt.legend()
    plt.xlabel("Time (s)")
    plt.ylabel("# servers")
    plt.show()


# Plot all iterations of a single policy
def plot_servers_over_time():

    results = pd.DataFrame()

    for i in range(0, RANGE):
        sim_id = starting_simulation_id - i
        print(f'Analyzing simulation {sim_id}')

        num_servers = get_num_servers(sim_id, i + 1)

        results = results.join(num_servers, how="outer")

    results.plot()
    plt.title("Number of servers over time")
    plt.grid(True)
    plt.show()

    return results


if __name__ == "__main__":
    starting_simulation_id = get_simulation_id()

    results = plot_servers_over_time()

    # get_confidence_intervals_policy(starting_simulation_id)

    # plot_error_bar_all_policies()

