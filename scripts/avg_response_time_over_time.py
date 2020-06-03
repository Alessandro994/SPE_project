import math
import os

import numpy as np
import pandas as pd
from influxdb_client import InfluxDBClient
from matplotlib import pyplot as plt
from scipy.stats import t

from DataObjects.MeanResponseTime import MeanResponseTime

SIMULATION_ID_FILE = "build/simulation.txt"
WINDOW_SIZE = 2500

def total_avg(values):
    avg = []
    c = 0
    sum = 0
    for i in range(0, len(values)):
        c += 1
        sum += values[i]
        avg.append(sum / c)

    return avg

def window_avg(values):
    avg = []
    seen_values = []
    sum = 0

    for i in range(0, WINDOW_SIZE):
        seen_values.append(values[i])
        sum += values[i]

    for i in range(WINDOW_SIZE, len(values)):
        avg.append(sum / WINDOW_SIZE)
        sum -= seen_values.pop(0)
        sum += values[i]
        seen_values.append(values[i])

    return avg



def compute_avg_over_time(simulation_id: int) -> MeanResponseTime:
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

    values = requests_duration['_value'].to_numpy()
    print(f'Initial number of samples: {len(values)}.')


    #avg =  total_avg(values)
    avg = window_avg(values)
    return avg


def get_simulation_id() -> int:
    if not os.environ.get("SIMULATION"):
        # Read the ID of the simulation from the file
        simulation_file = open(SIMULATION_ID_FILE, "r")
        simulation_id = simulation_file.read()
    else:
        simulation_id = os.environ.get("SIMULATION")

    return int(simulation_id)

if __name__ == "__main__":
    sim = get_simulation_id()
    print(f'Analyzing simulation {sim}')

    avg = []
    if os.environ.get("ANALYSIS_TRIPLE") == "true":
        for i in range(0, 3):
            try:
                avg.append(compute_avg_over_time(sim-i))
            except KeyError:
                avg.append([])
        labels = ["least connected", "random", "round robin"]

        for i in range(0, 3):
            plt.plot(avg[i], label=labels[i])

        plt.title(f"Comparison of moving average (wind. {WINDOW_SIZE})")

    else:
        avg = compute_avg_over_time(sim)
        plt.plot(avg, label=f"Sim {sim}")
        plt.title("Average over time of response time")

    plt.legend()
    plt.xlabel("Time")
    plt.ylabel("Average Response Time")
    plt.show()

