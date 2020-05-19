import matplotlib.pyplot as plt
import pandas as pd
from influxdb_client import Dialect, InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from matplotlib import pyplot as plt
from statsmodels.graphics.tsaplots import plot_acf

# def plot_autocorrelation_packet_in_sys(df: pd.DataFrame):
#     plt.acorr(df.to_numpy(), maxlags=None, lw=0.5, usevlines=True)
#     plt.grid(True)
#     plt.title("Autocorrelation of the requests system")
#     plt.xlim(0)
#     plt.show()


client = InfluxDBClient(url="http://localhost:8086",
                        token="my-token", org="BBM SpA")

query_api = client.query_api()

query_result = query_api.query_data_frame('import "experimental"'
                                          'from(bucket:"k6") '
                                          '|> range(start: -1y)'
                                          '|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.simulation == "8")'
                                          '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                                          '|> sort(columns: ["_time"], desc: false)'
                                          )

print(type(query_result['_value']))

# plot_acf(query_result['_value'].to_numpy())
# plt.show()

# plot_autocorrelation_packet_in_sys(query_result['_value'])
# plt.show()

ax = pd.plotting.autocorrelation_plot(query_result['_value'])
ax.set_xlim([0, 1000])
plt.show()
