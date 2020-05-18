from influxdb_client import Dialect, InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

client = InfluxDBClient(url="http://localhost:8086", token="my-token", org="BBM SpA")

query_api = client.query_api()

data_frame = query_api.query_data_frame('from(bucket:"my-bucket") '
                                        '|> range(start: -10m)')

print(data_frame.to_string())
