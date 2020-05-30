### Queries
The file for taking down some queries wrt simulations.

#### Number of request served by each server
```
import "experimental"
from(bucket: "k6")
  |> range(start: dashboardTime)
  |> filter(fn: (r) => r._measurement == "response_time" and r._field == "value" and r.simulation == "41")
  |> group(columns: ["server_id"])
  |> count()
  |> group()
  |> sort(columns: ["_value"], desc: true)
```

#### Response time
```
import "experimental"
from(bucket:"k6")
  |> range(start: -1y)
  |> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "93")
  |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
  |> sort(columns: ["_time"], desc: false)
```


#### Response time per server (broken)
```
import "experimental"
from(bucket:"k6")
  |> range(start: -1y)
  |> filter(fn: (r) => r._measurement == "response_time" and r._field == "value" and r.simulation == "95")
  |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
  |> group(columns: ["server_id"], mode:"by")
  |> sort(columns: ["_time"], desc: false)
```