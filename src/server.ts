import express = require('express');
import {MersenneTwister19937, Random} from "random-js";

let random: Random;
let responseTime: number;

// Create a new express application instance
const app: express.Application = express();

// ------------------------------------------------------------------
// Server configuration (fixed and defined by the process)
// ------------------------------------------------------------------

// Exponential distribution parameter lambda
const lambda = process.env.LAMBDA;
if (lambda === undefined) {
    console.error('Lambda parameter must be specified.');
    process.exit(1);
}

// Port
const port = process.env.PORT;
if (port === undefined) {
    console.error('Server port must be specified.');
    process.exit(1);
}

// Server ID
const serverId = process.env.SERVER_ID;
if (serverId === undefined) {
    console.error('Server ID must be specified.');
    process.exit(1);
}

// ------------------------------------------------------------------
// Server customization (provided as the environment variables)
// ------------------------------------------------------------------

// Seed
const seed = process.env.SEED!;
random = new Random(MersenneTwister19937.seed(parseInt(seed)));

// Minimum response time
const minResponseTime = process.env.MIN_RESPONSE_TIME;
if (minResponseTime === undefined) {
    console.error('MIN_RESPONSE_TIME must be specified.');
    process.exit(1);
}

// Use exponential response time
const expResponseTime = process.env.EXP_RESPONSE_TIME;
if (expResponseTime === undefined) {
    console.info("Using static response time");
}

// ------------------------------------------------------------------
// Server business logic
// ------------------------------------------------------------------

app.get('/', function (req, res) {
    const processingTime = getResponseTime(lambda)
    setTimeout(() => {
        res.header('X-Server-Id', serverId);
        res.header('X-Sim-Processing-Time', processingTime.toString());
        res.status(200).send();
    }, processingTime);
});

app.listen(port, function () {
    console.info(`Server ${serverId} listening on port ${port}. Lambda: ${lambda}`);
});


/**
 * Generate a response time.
 * If not specified, the response time is drawn from an exponential distribution.
 */
export function getResponseTime(lambda: string): number {

    if (expResponseTime === undefined) {
        responseTime = parseInt(minResponseTime!);
    } else {
        if (expResponseTime === 'true') {
            const value = random.realZeroToOneInclusive();
            responseTime = (-Math.log(1 - value) / parseFloat(lambda)) + parseInt(minResponseTime!);
        } else {
            console.error('Invalid value for EXP_RESPONSE_TIME.');
            process.exit(1);
        }
    }

    return responseTime;
}