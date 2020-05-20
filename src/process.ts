import {ChildProcess, exec, spawn} from 'child_process';
import * as fs from 'fs';
import mustache from 'mustache';
import {MersenneTwister19937, Random} from 'random-js';
import {promisify} from 'util';


export interface K6Tag {
    name: string;
    value: string;
}

const NUM_SERVERS = process.env.NUM_SERVERS as string;
if (!NUM_SERVERS) {
    throw new Error("Please define env variable NUM_SERVERS")
}

export function startNginx() {
    writeNginxConf();

    console.info("Starting nginx on port 8080");
    // Inherit stdout and stdin from parent process
    const nginx = spawn('nginx', ["-c", "nginx/nginx.conf", "-p", process.cwd()], {stdio: 'inherit'});

    // nginx.stdout.on('data', (data) => {
    //     console.log(`${data}`);
    // });

    // nginx.stderr.on('data', (data) => {
    //     console.log(`${data}`);
    // });

    return nginx;
}

const startingPort = 8081;
export function startServers() {
    const serverProcesses = new Array<ChildProcess>();

    // define PRNG
    let random;
    const seed = process.env.SEED
    if (seed === undefined) {
        console.log("Using random seed")
        random = new Random(MersenneTwister19937.autoSeed())
    } else {
        console.log(`Using seed ${seed}`)
        random = new Random(MersenneTwister19937.seed(parseInt(seed)))
    }

    for (let index = 0; index < Number.parseInt(NUM_SERVERS); index++) {

        // clone the actual env vars to avoid overrides
        const env = Object.create(process.env);

        // Set the server port and id via environment variable
        env.PORT = startingPort + index;
        env.SERVER_ID = index;

        const serverSeed = random.integer(0, 0x19999999999999); // [0 - 2^52]
        env.SEED = serverSeed;

        const server = spawn('node', ["build/server.js"], {env: env});
        serverProcesses.push(server);

        server.stdout.on('data', (data: any) => {
            console.log(`${data}`);
        });

        server.stderr.on('data', (data: any) => {
            console.log(`${data}`);
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
        variables.servers.push({port: port})
    }

    const upstreamConfiguration = mustache.render(template.toString(), variables);
    fs.writeFileSync("nginx/upstream.conf", upstreamConfiguration);
    console.log("Written Nginx configuration");
}

export async function k6(simulationID: Number, tag?: K6Tag) {
    console.info("Starting k6");
    // clone the actual env vars to avoid overrides
    const env = Object.create(process.env);
    // Set the simulation id
    env.SIMULATION = simulationID;
    return promisify(spawn)(`k6`, ['run', '--out', 'influxdb', 'src/http_requests.js'], {env: env, stdio: "inherit"});
}