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
```