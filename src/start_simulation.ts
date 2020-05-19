import { startNginx, startServers, k6 } from './process'
import { ChildProcess } from 'child_process'

let iterations = process.env.ITERATIONS as string;
// By default we do 1 iteration
if (iterations == undefined) {
    iterations = "1"
}

for (let i = 0; i < Number.parseInt(iterations); i++) {
    console.info(`Starting iteration ${i}`);

    let processes = Array<ChildProcess>();
    processes.push(startNginx());
    processes = processes.concat(startServers());

    processes.forEach(process => {
        process.on('close', (code, signal) => {
            console.log(`Process exited with code ${code}. Shutting down simulation`)
            stopSimulation(processes)
        })
    });

    k6().then((output) => console.log(output.stdout))
    .finally(() => stopSimulation(processes));
}

function stopSimulation(processes: Array<ChildProcess>) {
    processes.forEach(process => process.kill())
    process.exit(1)
}