import {FluxTableMetaData, InfluxDB} from '@influxdata/influxdb-client';
import {ChildProcess} from 'child_process';
import {reloadNginx, startServer, writeNginxConf} from "./process";
import {SimulationData} from "./SimulationData";


export class AutoScaleSettings {
  /**
   * Maximum number of servers to spawn
   */
  readonly maxServers = 20;
  /**
 * Minimum number of servers to spawn
 */
  readonly minServers = 1;
  /**
  * Interval in ms to check if we need to scale the servers
  */
  readonly scaleIntervalMs = 1000;
  /**
   * Time range in milliseconds to look for requests
   */
  readonly requestsRangeMs = 10000;
  /**
   * Threshold after which a new server is created
   */
  readonly increaseThreshold = 1000;
  /**
   * Threshold after which a server is shutdown
   */
  readonly decreaseThreshold = 950;
}

const queryApi = new InfluxDB({url: "http://localhost:8086", token: ""}).getQueryApi("")

function getRequestsPerSecond(simData: SimulationData, autoscale: AutoScaleSettings): Promise<number> {

  const fluxQuery = `import "experimental"
                    from(bucket:"k6")
                      |> range(start: -1y)
                      |> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "${simData.id}")
                      |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
                      |> range(start: -${autoscale.requestsRangeMs}ms)
                      |> count()`

  const responseTimeQuery = `
     import "experimental"
     from(bucket:"k6")
       |> range(start: -1y)
       |> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "${simData.id}")
       |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
       |> range(start: -${autoscale.requestsRangeMs}ms)
       |> timedMovingAverage(every: 10s, period: ${autoscale.requestsRangeMs}ms)
       |> last()
     `

  return new Promise((resolve, reject) => {
    queryApi.queryRows(responseTimeQuery, {
      next(row: string[], tableMeta: FluxTableMetaData) {
        const o = tableMeta.toObject(row)
        resolve(o._value)
      },
      error(error: Error) {
        reject(error)
      },
      complete() {resolve(0)}
    })
  })
}

/**
 * Check if it is necessary to change the number of servers given the number of requests received
 * @returns ChildProcess The handler to the newly created process
 *
 *          void If no server process was created
 */
export async function scaleServers(simulation: SimulationData, autoscaleSettings: AutoScaleSettings): Promise<ChildProcess | void> {

  if (simulation.numServers >= autoscaleSettings.maxServers) {
    // Maximum number of servers reached, do nothing
    return;
  }

  // const requests = await getRequestsPerSecond(simulation, autoscaleSettings)
  const avg_request_duration = await getRequestsPerSecond(simulation, autoscaleSettings)

  // Approximate number of requests per second
  // const requestsPerSeconds = requests / (autoscaleSettings.requestsRangeMs / 1000);

  // const requestsPerServer = requestsPerSeconds / simulation.numServers

  // console.log(avg_request_duration)
  // Check if we need to scale
  if (avg_request_duration > autoscaleSettings.increaseThreshold) {
    // Increase the number of servers
    simulation.numServers = simulation.numServers + 1

    // console.debug(`Req per server: ${requestsPerServer}, create server ${simulation.numServers}`)
    console.debug(`Req duration: ${avg_request_duration}, create server ${simulation.numServers}`)

    // Spawn a new server
    const port = simulation.startingPort + simulation.numServers
    const server = startServer({
      port: port,
      lambda: process.env.LAMBDA as string,
      serverID: simulation.numServers,
      random: simulation.random
    })
    // Save the reference to the new server
    simulation.addProcess(server);

    // Reload Nginx
    writeNginxConf(simulation);
    reloadNginx(simulation.processes[0])

    return server;
  } else if (avg_request_duration < autoscaleSettings.decreaseThreshold) {

    if (simulation.numServers == autoscaleSettings.minServers) {
      return;
    }

    // console.log(`Req per server: ${requestsPerServer}, shut down server ${simulation.numServers}`)
    console.log(`Req duration: ${avg_request_duration}, shut down server ${simulation.numServers}`)
    const lastServer = simulation.processes.pop()
    lastServer?.kill()
    // Decrease the number of servers
    simulation.numServers = simulation.numServers - 1
    // Reload Nginx
    writeNginxConf(simulation);
    reloadNginx(simulation.processes[0])
    return;

  }
}

// const simData = new SimulationData()

// setInterval(scaleServers, INTERVAL_MS, simData)
