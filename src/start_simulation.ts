import { ChildProcess } from 'child_process';
import { k6, startNginx, startServers } from './process';
import * as fs from 'fs';

let iterations = process.env.ITERATIONS as string;
// By default we do 1 iteration
if (iterations == undefined) {
    iterations = "1"
}
// File containing the last simulation
const SIMULATION_ID_FILE="build/simulation.txt"

// Initialize the file the first time
if (!fs.existsSync(SIMULATION_ID_FILE)) {
    fs.writeFileSync(SIMULATION_ID_FILE, "0");
}
// Increment simulationID
let simulationID = Number.parseInt(fs.readFileSync(SIMULATION_ID_FILE, {encoding: "utf8"}));
simulationID+=1
fs.writeFileSync(SIMULATION_ID_FILE, simulationID);

console.info(`Simulation ID: ${simulationID}`)
console.info(`Total iterations: ${iterations}`)

async function runSimulation(iteration: Number) {
    console.info(`Starting iteration ${iteration}`);

    let processes = Array<ChildProcess>();
    processes.push(startNginx());
    processes = processes.concat(startServers());

    processes.forEach(process => {
        process.on('close', (code, signal) => {
            if (code) {
                console.log(`Process exited with code ${code}. Shutting down simulation`)
                stopSimulation(processes, true)
            }
        })
    });

    return k6(simulationID).then((output) => console.log(output.stdout))
        .finally(() => {
            console.info(`Finished iteration ${iteration}`);
            stopSimulation(processes);
        });

}

function stopSimulation(processes: Array<ChildProcess>, failure = false) {
    processes.forEach(process => process.kill())

    if (failure) {
        process.exit(1)
    }
}


async function main() {
    for (let i = 0; i < Number.parseInt(iterations); i++) {
        await runSimulation(i);
    }
    console.log("Finished simulation");
}

main()