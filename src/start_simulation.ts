import { startNginx, startServers } from './servers'
import { ChildProcess } from 'child_process'

for (let i = 0; i < 1; i++) {
    let processes = Array<ChildProcess>();
    processes.push(startNginx());
    processes = processes.concat(startServers());

    processes.forEach(process => {
        process.on('close', (code, signal) => {
            console.log(`Process exited with code ${code}. Shutting down simulation`)
            stopSimulation(processes)
        })
    });

}

function stopSimulation(processes: Array<ChildProcess>) {
    processes.forEach(process => process.kill())
    process.exit(1)
}