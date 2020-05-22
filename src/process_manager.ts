import {InfluxDB, FluxTableMetaData} from '@influxdata/influxdb-client'


const queryApi = new InfluxDB({url: "http://localhost:8086", token:""}).getQueryApi("")

const fluxQuery =
  'from(bucket:"k6") |> range(start: 0) |> filter(fn: (r) => r._measurement == "temperature")'

  