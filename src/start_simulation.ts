import { ChildProcess } from 'child_process';
import { k6, startNginx, startServers } from './process';
import { SimulationData } from "./SimulationData";
import { promisify } from 'util'
import * as fs from 'fs';
import { scaleServers, AutoScaleSettings } from './autoscaler';
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

async function runSimulation(iteration: Number) {
    const simData = new SimulationData(simulationID)
    const autoscaleSettings = new AutoScaleSettings()

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
        console.info('Autoscaling enabled')
        // Start the auto-scaling scheduling
        scheduleAutoScaling(simData, autoscaleSettings);
    } else {
        console.info('Autoscaling disabled')
    }

    const k6Promise = new Promise((resolve, _reject) => {
        k6Process.on('close', (_code, _signal) => {
            console.info(`Finished iteration ${iteration}`);
            simData.stopSimulation();
            resolve();
        })
    });

    return k6Promise;
}

/**
 * Periodically check if we need to scale, waiting for the scaleServers function to finish
 * before scheduling the next
 */
async function scheduleAutoScaling(simData: SimulationData, autoscaleSettings: AutoScaleSettings) {

    // Save as reference when we started the scaling operation
    const startingTime = Date.now()

    scaleServers(simData, autoscaleSettings).then(async () => {
        // Calculate how much time has passed since we started scheduling
        const elapsed = Date.now() - startingTime;

        // Calculate the interval we need to wait before scheduling the next scaling operation
        const sleepIntervalMs = autoscaleSettings.scaleIntervalMs - elapsed;

        // If we have a positive sleep interval, sleep for the remaining time
        if (sleepIntervalMs > 0) {
            await new Promise(resolve =>
                simData.autoScaleTimeout = setTimeout(resolve, sleepIntervalMs)
            );
        }
        // Reschedule periodically the scale operation
        scheduleAutoScaling(simData, autoscaleSettings);
    })

}

async function main() {
    for (let i = 0; i < Number.parseInt(iterations); i++) {
        await runSimulation(i);
    }
    console.log("Finished simulation");
}

main();