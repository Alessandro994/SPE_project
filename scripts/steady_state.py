import matplotlib.pyplot as plt
import pandas as pd
from influxdb_client import Dialect, InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from matplotlib import pyplot as plt
from statsmodels.graphics.tsaplots import plot_acf

client = InfluxDBClient(url="http://localhost:8086",
                        token="my-token", org="BBM SpA")

query_api = client.query_api()

query_result = query_api.query_data_frame('import "experimental"'
                                          'from(bucket:"k6") '
                                          '|> range(start: -1y)'
                                          '|> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.simulation == "13")'
                                          '|> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))'
                                          '|> sort(columns: ["_time"], desc: false)'
                                          )

ax = pd.plotting.autocorrelation_plot(query_result['_value'])
ax.set_xlim([0, 1000])
plt.show()
