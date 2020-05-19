import {ChildProcess} from 'child_process';
import {k6, startNginx, startServers} from './process';

let iterations = process.env.ITERATIONS as string;
// By default we do 1 iteration
if (iterations == undefined) {
    iterations = "1"
}

const tag = process.env.SIMULATION
if (tag === undefined) {
    console.error('Tag of the simulation must be specified.')
    process.exit(1);
}

for (let i = 0; i < Number.parseInt(iterations); i++) {
    console.info(`Starting iteration ${i}`);

    let processes = Array<ChildProcess>();
    processes.push(startNginx());
    processes = processes.concat(startServers());

    processes.forEach(process => {
        process.on('close', (code, signal) => {
            console.log(`Process exited with code ${code}. Shutting down simulation`)
            stopSimulation(processes, true)
        })
    });

    k6({name: 'simulation', value: tag}).then((output) => console.log(output.stdout))
        .finally(() => stopSimulation(processes));
}

function stopSimulation(processes: Array<ChildProcess>, failure = false) {
    processes.forEach(process => process.kill())
    process.exit(failure ? 1 : 0)
}