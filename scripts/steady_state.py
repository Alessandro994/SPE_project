import matplotlib.pyplot as plt
import pandas as pd
from influxdb_client import Dialect, InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS


def plot_autocorrelation_packet_in_sys(df: pd.DataFrame):
    plt.acorr(df, maxlags=100, normed=True, lw=0.5, usevlines=True)
    plt.grid(True)
    plt.title("Autocorrelation of the requests system")
    plt.xlim(0)
    plt.show()


client = InfluxDBClient(url="http://localhost:8086", token="my-token", org="BBM SpA")

query_api = client.query_api()

query_result = query_api.query_data_frame('from(bucket:"k6") '
                                        '|> range(start: -1h)'
                                        '|> filter(fn: (r) => r._measurement == "http_req_duration" and (r._field == "value"))'
                                        )
plot_autocorrelation_packet_in_sys(query_result['_value'])
