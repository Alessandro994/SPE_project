import { startServer, writeNginxConf, reloadNginx } from "./process";
import { SimulationData } from "./SimulationData";
import { InfluxDB, FluxTableMetaData, FluxResultObserver } from '@influxdata/influxdb-client'
import { MersenneTwister19937, Random } from 'random-js';
import { ChildProcess } from 'child_process';
import { promisify } from 'util'

const setIntervalPromise = promisify(setInterval);
const setTimeoutPromise = promisify(setTimeout);

export class AutoScaleSettings {
  /**
  * Interval in ms to check if we need to scale the servers
  */
  readonly scaleIntervalMs = 5000;
  /**
   * Threshold after which a new server is created
   */
  readonly scaleMaxThreshold = 50;
  /**
   * Time range in milliseconds to look for requests
   */
  readonly requestsRangeMs = 2000;
}

const queryApi = new InfluxDB({ url: "http://localhost:8086", token: "" }).getQueryApi("")

function getRequestsPerSecond(simData: SimulationData, autoscale: AutoScaleSettings): Promise<Number> {

  const fluxQuery = `import "experimental"
                    from(bucket:"k6")
                      |> range(start: -1y)
                      |> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "${simData.id}")
                      |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
                      |> range(start: -${autoscale.requestsRangeMs}s)`

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row: string[], tableMeta: FluxTableMetaData) {
        const o = tableMeta.toObject(row)
        resolve(o._value)
      },
      error(error: Error) {
        reject(error)
      },
      complete() { resolve(0) }
    })
  })
}

/**
 * Check if it is necessary to change the number of servers given the number of requests received
 * //TODO: PNRG
 */
export async function scaleServers(simulation: SimulationData, autoscale: AutoScaleSettings): Promise<ChildProcess | void> {
  const requests = await getRequestsPerSecond(simulation, autoscale)
  console.debug(requests)
  if (requests > autoscale.scaleMaxThreshold) {
    console.debug(`Requests: ${requests}, creating a new server`)

    // Increase the number of servers
    simulation.numServers++
    const port = simulation.startingPort + simulation.numServers
    const server = startServer({
      port: port,
      lambda: process.env.LAMBDA as string,
      serverID: simulation.numServers,
      random: simulation.random
    })

    simulation.addProcess(server);

    writeNginxConf(simulation);
    reloadNginx(simulation.processes[0])

    return server;
  }
}

// const simData = new SimulationData()

// setInterval(scaleServers, INTERVAL_MS, simData)
