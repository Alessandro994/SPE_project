import {FluxTableMetaData, InfluxDB} from '@influxdata/influxdb-client';
import {ChildProcess} from 'child_process';
import {reloadNginx, startServer, writeNginxConf} from "./process";
import {SimulationData} from "./SimulationData";


export interface AutoScaleAlgorithm {
    policy: "RESPONSE_TIME" | "REQUESTS_PER_SECOND";
    settings: AutoScaleSettings;
    calculateLoad(): Promise<number>;
}

export class ResponseTimeAutoScaler implements AutoScaleAlgorithm {
    constructor(readonly settings: AutoScaleSettings, readonly simulation: SimulationData, readonly policy: "RESPONSE_TIME" | "REQUESTS_PER_SECOND") {
    }

    async calculateLoad(): Promise<number> {
        return await estimateLoadFactor(this.responseTimeQuery());
    }

    private responseTimeQuery() {
        return `import "experimental"
                 from(bucket:"k6")
                   |> range(start: -1y)
                   |> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "${this.simulation.id}")
                   |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
                   |> range(start: -${this.settings.timeIntervalMs}ms)
                   |> timedMovingAverage(every: ${this.settings.timeIntervalMs/2}ms, period: ${this.settings.timeIntervalMs}ms)
                   |> last()`
    }
}

export class RequestPerSecondAutoScaler implements AutoScaleAlgorithm {
    constructor(readonly settings: AutoScaleSettings, readonly simulation: SimulationData, readonly policy: "RESPONSE_TIME" | "REQUESTS_PER_SECOND") {
    }
  async calculateLoad(): Promise<number> {
    const requestsPerSecond = await estimateLoadFactor(this.requestsQuery())

    // Approximate number of requests per second
    const requestsPerSeconds = requestsPerSecond / (this.settings.timeIntervalMs / 1000);

    return requestsPerSeconds / this.simulation.numServers;
  }

  private requestsQuery() {
      return `import "experimental"
              from(bucket:"k6")
                |> range(start: -1y)
                |> filter(fn: (r) => r._measurement == "http_req_duration" and r._field == "value" and r.status == "200" and r.simulation == "${this.simulation.id}")
                |> map(fn:(r) => ({r with _time: experimental.subDuration(d: duration(v: int(v: r._value*1000000.0)), from: r._time)}))
                |> range(start: -${this.settings.timeIntervalMs}ms)
                |> count()`
  }
}
export class AutoScaleSettings {

  constructor() {
    this.increaseThreshold = parseFloat(process.env.AUTOSCALE_INCREASE_THRESHOLD!)
    this.decreaseThreshold = parseFloat(process.env.AUTOSCALE_DECREASE_THRESHOLD!)
    this.autoScaleIntervalMs = parseFloat(process.env.AUTOSCALE_ALGORITHM_INTERVAL!)
    this.timeIntervalMs = parseFloat(process.env.AUTOSCALE_LOOKUP_INTERVAL!)
  }
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
  autoScaleIntervalMs: number;
  /**
   * Time range in milliseconds to look for requests
   */
  timeIntervalMs: number;
  /**
   * Threshold after which a new server is created
   */
  increaseThreshold: number;
  /**
   * Threshold after which a server is shutdown
   */
  decreaseThreshold: number;
}

const queryApi = new InfluxDB({url: "http://localhost:8086", token: ""}).getQueryApi("")

function estimateLoadFactor(query: string): Promise<number> {

  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
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
export async function scaleServers(simulation: SimulationData, autoscaler: AutoScaleAlgorithm): Promise<ChildProcess | void> {
  if (simulation.numServers >= autoscaler.settings.maxServers) {
    // Maximum number of servers reached, do nothing
    return;
  }

  const loadFactor = await autoscaler.calculateLoad()

  // Check if we need to scale
  if (loadFactor > autoscaler.settings.increaseThreshold) {
    // Increase the number of servers
    simulation.numServers = simulation.numServers + 1

    console.debug(`Load factor: ${loadFactor.toFixed(2)}, create server ${simulation.numServers}`)

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
  } else if (loadFactor < autoscaler.settings.decreaseThreshold) {

    if (simulation.numServers == autoscaler.settings.minServers) {
      return;
    }

    console.log(`Load factor: ${loadFactor.toFixed(2)}, shut down server ${simulation.numServers}`)
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

// const simData = new SimulationData(1)
// const settings = new AutoScaleSettings()
// const scaler = new ResponseTimeAutoScaler(settings, simData, "RESPONSE_TIME")
// setInterval(scaleServers, 1000, simData, scaler)
