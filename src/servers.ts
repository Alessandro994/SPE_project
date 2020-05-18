import * as child_process from 'child_process';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import mustache from 'mustache';


const NUM_SERVERS = process.env.NUM_SERVERS as string;
if (!NUM_SERVERS) {
    throw new Error("Please define env variable NUM_SERVERS")
}

export function startNginx() {
    console.info("Starting nginx on port 8080");
    // Inherit stdout and stdin from parent process
    const nginx = child_process.spawn('nginx', ["-c", "nginx.conf", "-p", process.cwd()], { stdio: 'inherit' });

    // nginx.stdout.on('data', (data) => {
    //     console.log(`${data}`);
    // });

    // nginx.stderr.on('data', (data) => {
    //     console.log(`${data}`);
    // });
}

const startingPort = 8081;
export function startServers() {
    const serverProcesses = new Array<ChildProcess>();
    for (let index = 0; index < Number.parseInt(NUM_SERVERS); index++) {

        // clone the actual env vars to avoid overrides
        var env = Object.create(process.env);
        // Set the server port and id via environment variable
        env.PORT = startingPort + index;
        env.SERVER_ID = index;

        const server = child_process.spawn('node', ["build/server.js"], { env: env });
        serverProcesses.push(server);

        server.stdout.on('data', (data: any) => {
            console.log(`${data}`);
        });

        server.stderr.on('data', (data: any) => {
            console.log(`${data}`);
        });

        server.on('close', (code: any) => {
            console.log(`Server ${index} exited with code ${code}`);
            stopProcesses(serverProcesses);
        });
    }
    return serverProcesses;
}

function writeNginxConf() {
    // Create the upstream.conf file based on the number of servers
    // Read the mustache template
    const template = fs.readFileSync("nginx/upstream.conf.mustache");

    const variables = {
        servers: Array()
    };

    for (let index = 0; index < Number.parseInt(NUM_SERVERS); index++) {
        const port = startingPort + index;
        variables.servers.push({ port: port })
    }

    const upstreamConfiguration = mustache.render(template.toString(), variables);
    fs.writeFileSync("nginx/upstream.conf", upstreamConfiguration);
}


function stopProcesses(processes: Array<ChildProcess>) {
    processes.forEach(process => {
        console.log(`Stopping process ${process.pid}`);
        process.kill()
    })
}

// exports.startNginx = startNginx;
// exports.startServers = startServers;

writeNginxConf();
startNginx();
startServers();