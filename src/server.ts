import express = require('express');
import {MersenneTwister19937, Random} from "random-js";

let lambda: number;
let random: Random;
let responseTime: number;

// Create a new express application instance
const app: express.Application = express();

// Seed init
const seed = process.env.SEED;
if (seed === undefined) {
    // Auto initialize seed
    random = new Random(MersenneTwister19937.autoSeed());
} else {
    // Use value provided as env variable
    random = new Random(MersenneTwister19937.seed(parseInt(seed)));
}

// Set exponential distribution parameter lambda
const lambdaParam = process.env.LAMBDA;
if (lambdaParam === undefined) {
    lambda = 1;
} else {
    lambda = parseFloat(lambdaParam);
}

// Get port from script
const port = process.env.PORT;
if (port === undefined) {
    console.error('Server port must be specified.');
    process.exit(1);
}

const serverId = process.env.SERVER_ID;
if (serverId === undefined) {
    console.error('Server ID must be specified.')
    process.exit(1);
}

app.get('/', function (req, res) {
    setTimeout(() => {
        res.header('server_id', serverId);
        res.status(200).send();
    }, getResponseTime(lambda));
});

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});

/**
 * Generate a reponse time.
 * If not specified, the response time is drawn from an exponential distribution.
 */
function getResponseTime(lambda: number): number {

    const minResponseTime = process.env.MIN_RESPONSE_TIME;
    if (minResponseTime === undefined) {
        console.error('Minimum response time must be defined.')
        process.exit(1);
    } else {
        const expResponseTime = process.env.EXP_RESPONSE_TIME;
        if (expResponseTime === undefined) {
            responseTime = parseInt(minResponseTime);
        } else {
            const value = random.realZeroToOneInclusive();
            responseTime = (-Math.log(1 - value) / lambda) + parseInt(minResponseTime);
        }
    }

    return responseTime;
}