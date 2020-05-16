const { spawn } = require('child_process');
const fs = require('fs');
const mustache = require('mustache');

// clone the actual env vars to avoid overrides
// var env = Object.create( process.env );
// env.PORT = '8081';

const NUM_SERVERS = process.env.NUM_SERVERS;
if (!NUM_SERVERS) {
    throw new Exception("Please define env variable NUM_SERVERS")
}

function startNginx() {
    console.info("Starting nginx on port 8080");
    // Inherit stdout and stdin from parent process
    const nginx = spawn('nginx', ["-c", "nginx.conf", "-p", process.cwd()], { stdio: 'inherit' });

    // nginx.stdout.on('data', (data) => {
    //     console.log(`${data}`);
    // });

    // nginx.stderr.on('data', (data) => {
    //     console.log(`${data}`);
    // });
}

const startingPort = 8081;
function startServers() {
    for (let index = 0; index < NUM_SERVERS; index++) {

        // clone the actual env vars to avoid overrides
        var env = Object.create(process.env);
        // Set the server port and id via environment variable
        env.PORT = startingPort + index;
        env.SERVER_ID = index;

        const server = spawn('node', ["build/server.js"], { env: env });

        server.stdout.on('data', (data) => {
            console.log(`${data}`);
        });

        server.stderr.on('data', (data) => {
            console.log(`${data}`);
        });

        server.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }
}

// Create the upstream.conf file based on the number of servers
// Read the mustache template
const template = fs.readFileSync("nginx/upstream.conf.mustache");

const variables = {
    servers: [ ]
};

for (let index = 0; index < NUM_SERVERS; index++) {
    const port = startingPort + index;
    variables.servers.push({port: port})
}

const upstreamConfiguration = mustache.render(template.toString(), variables);
fs.writeFileSync("nginx/upstream.conf", upstreamConfiguration);

startNginx();
startServers();