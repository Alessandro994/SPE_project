const { spawn } = require('child_process');

// clone the actual env vars to avoid overrides
// var env = Object.create( process.env );
// env.PORT = '8081';

const NUM_SERVERS = process.env.NUM_SERVERS;
if (!NUM_SERVERS) {
    throw new Exception("Please define env variable NUM_SERVERS")
}

let startingPort = 8081;


for (let index = 0; index < NUM_SERVERS; index++) {

    // clone the actual env vars to avoid overrides
    var env = Object.create( process.env );
    env.PORT = startingPort+index;

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
