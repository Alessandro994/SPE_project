import {ChildProcess, spawn} from 'child_process';
import * as fs from 'fs';
import mustache from 'mustache';
import {MersenneTwister19937, Random} from 'random-js';
import {SimulationData} from './SimulationData';


export function startNginx(simData: SimulationData) {
    writeNginxConf(simData);

    console.info("Starting nginx on port 8080");
    // Inherit stdout and stdin from parent process
    const nginx = spawn('nginx', ["-c", "nginx/nginx.conf", "-p", process.cwd()], {stdio: ["ignore", "inherit", "ignore"]});

    return nginx;
}

const lambdas = [0.005, 0.01, 1, 10];

/**
 * Starts the nodejs servers, as many as the number defined inside the SimulationData object
 */
export function startServers(simulation: SimulationData) {
    const serverProcesses = new Array<ChildProcess>();

    for (let index = 0; index < simulation.numServers; index++) {
        // If env variable is defined, used it. Otherwise use the lambdas array
        const lambda = (process.env.LAMBDA === undefined) ? lambdas[index] : process.env.LAMBDA;

        const server = startServer({
            port: simulation.startingPort + index,
            serverID: index + 1,
            lambda: lambda,
            random: simulation.random
        })
        serverProcesses.push(server);
    }

    return serverProcesses;
}

/**
 * Start an express server, according to the settings passed as parameter
 * @returns A reference to the created process
 */
export function startServer(settings: { port: number, serverID: number, lambda: number | string, random: Random }): ChildProcess {
    // clone the actual env vars to avoid overrides
    const env = Object.create(process.env);

    // Set the server port and id via environment variable
    env.PORT = settings.port;
    env.SERVER_ID = settings.serverID;
    env.LAMBDA = settings.lambda;

    // [0 - 2^52]
    env.SEED = settings.random.integer(0, 0x19999999999999);

    const server = spawn('node', ["build/server.js"], {env: env});

    server.stdout.on('data', (data: any) => {
        console.log(`${data}`);
    });

    server.stderr.on('data', (data: any) => {
        console.log(`${data}`);
    });
    return server;
}

export function writeNginxConf(simulation: SimulationData) {
    // Create the upstream.conf file based on the number of servers
    // Read the mustache template
    const template = fs.readFileSync("nginx/upstream.conf.mustache");

    const variables = {
        servers: Array(),
        balancing_policy: simulation.loadBalancing
    };

    for (let index = 0; index < simulation.numServers; index++) {
        const port = simulation.startingPort + index;
        variables.servers.push({port: port, param: process.env.NGINX_SERVER_PARAM})
    }

    const upstreamConfiguration = mustache.render(template.toString(), variables);
    fs.writeFileSync("nginx/upstream.conf", upstreamConfiguration);
    // console.log("Written Nginx configuration");
}

export function reloadNginx(nginx: ChildProcess) {
    // console.info("Reloading Nginx configuration")
    nginx.kill("SIGHUP")
}

export function k6(simulationID: Number) {
    console.info("Starting k6");
    // clone the actual env vars to avoid overrides
    const env = Object.create(process.env);
    // Set the simulation id
    env.SIMULATION = simulationID;
    return spawn(`k6`, ['run', '--out', 'influxdb', 'src/http_requests.js'], {
        env: env,
        stdio: ["ignore", "inherit", "inherit"]
    });
}