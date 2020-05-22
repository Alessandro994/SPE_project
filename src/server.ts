import express = require('express');
import {MersenneTwister19937, Random} from "random-js";

let lambda: number;
let random: Random;
let responseTime: number;

// Create a new express application instance
const app: express.Application = express();

// Seed init
const seed = process.env.SEED!;
random = new Random(MersenneTwister19937.seed(parseInt(seed)));

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
    console.error('Server ID must be specified.');
    process.exit(1);
}

const minResponseTime = process.env.MIN_RESPONSE_TIME as string;
if (minResponseTime === undefined) {
    console.error('MIN_RESPONSE_TIME must be specified.');
    process.exit(1);
}

const expResponseTime = process.env.EXP_RESPONSE_TIME;
if (expResponseTime === undefined) {
    console.info("Using static response time");
}

app.get('/', function (req, res) {
    setTimeout(() => {
        res.header('X-Server-Id', serverId);
        res.status(200).send();
    }, getResponseTime(lambda));
});

app.listen(port, function () {
    console.info(`Server ${serverId} listening on port ${port}. Lambda: ${lambda}`);
});

/**
 * Generate a response time.
 * If not specified, the response time is drawn from an exponential distribution.
 */
function getResponseTime(lambda: number): number {

    if (expResponseTime === undefined) {
        responseTime = parseInt(minResponseTime);
    } else {
        if (expResponseTime === 'true') {
            const value = random.realZeroToOneInclusive();
            responseTime = (-Math.log(1 - value) / lambda) + parseInt(minResponseTime);
        } else {
            console.error('Invalid value for EXP_RESPONSE_TIME.');
            process.exit(1);
        }
    }

    return responseTime;
}