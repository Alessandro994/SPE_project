import { ChildProcess } from 'child_process';
import { k6, startNginx, startServers } from './process';
import { SimulationData } from "./SimulationData";
import { promisify } from 'util'
import * as fs from 'fs';
import {
    scaleServers,
    AutoScaleSettings,
    AutoScaleAlgorithm,
    ResponseTimeAutoScaler,
    RequestPerSecondAutoScaler
} from './autoscaler';
const setTimeoutPromise = promisify(setTimeout);

let iterations = process.env.ITERATIONS as string;
// By default we do 1 iteration
if (iterations == undefined) {
    iterations = "1"
}
// File containing the last simulation
const SIMULATION_ID_FILE = "build/simulation.txt";

// Initialize the file the first time
if (!fs.existsSync(SIMULATION_ID_FILE)) {
    fs.writeFileSync(SIMULATION_ID_FILE, "0");
}
// Increment simulationID
let simulationID = Number.parseInt(fs.readFileSync(SIMULATION_ID_FILE, { encoding: "utf8" }));
simulationID += 1;
fs.writeFileSync(SIMULATION_ID_FILE, simulationID.toString());

console.info(`Simulation ID: ${simulationID}`);
console.info(`Total iterations: ${iterations}`);

async function runSimulation(iteration: Number): Promise<SimulationData> {
    return new Promise<SimulationData>((resolve, reject) => {
        const simData = new SimulationData(simulationID)

        console.info(`Starting iteration ${iteration}`);

        simData.addProcess(startNginx(simData));

        const servers = startServers(simData);

        servers.forEach(server => simData.addProcess(server))

        // Start k6
        const k6Process = k6(simulationID);
        // Save reference to k6 process
        simData.addProcess(k6Process);

        // Autoscale number of servers
        if (simData.autoScale) {

            let autoscaler: AutoScaleAlgorithm
            const policy = process.env.AUTOSCALE_POLICY
            switch (policy) {
                case "RESPONSE_TIME":
                    autoscaler = new ResponseTimeAutoScaler(new AutoScaleSettings(), simData, policy)
                    break;
                case "REQUESTS_PER_SECOND":
                    autoscaler = new RequestPerSecondAutoScaler(new AutoScaleSettings(), simData, policy)
                    break;
                default:
                    console.error('Define AUTOSCALE_POLICY to one of the supported values')
                    return reject(simData);
            }
            console.info(`Autoscaling enabled with policy ${autoscaler.policy}`)
            // Start the auto-scaling scheduling
            scheduleAutoScaling(simData, autoscaler);
        } else {
            console.info('Autoscaling disabled')
        }

        k6Process.on('close', (_code, _signal) => {
            console.info(`Finished iteration ${iteration}`);
            simData.stopSimulation();
            resolve(simData);
        })
    });
}

/**
 * Periodically check if we need to scale, waiting for the scaleServers function to finish
 * before scheduling the next
 */
async function scheduleAutoScaling(simData: SimulationData, autoscaler: AutoScaleAlgorithm) {

    // Save as reference when we started the scaling operation
    const startingTime = Date.now()

    scaleServers(simData, autoscaler).then(async () => {
        // Calculate how much time has passed since we started scheduling
        const elapsed = Date.now() - startingTime;

        // Calculate the interval we need to wait before scheduling the next scaling operation
        const sleepIntervalMs = autoscaler.settings.autoScaleIntervalMs - elapsed;

        // If we have a positive sleep interval, sleep for the remaining time
        if (sleepIntervalMs > 0) {
            await new Promise(resolve =>
                simData.autoScaleTimeout = setTimeout(resolve, sleepIntervalMs)
            );
        }
        // Reschedule periodically the scale operation
        scheduleAutoScaling(simData, autoscaler);
    })

}

async function main() {
    for (let i = 0; i < Number.parseInt(iterations); i++) {
        try {
            await runSimulation(i);
        } catch (simulation) {
            console.error("Error while running simulation")
            simulation.stopSimulation(true)
        }
    }
    console.log("Finished simulation");
}

main();