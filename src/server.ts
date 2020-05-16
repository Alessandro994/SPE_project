import express = require('express');
import {MersenneTwister19937, Random} from "random-js";

const LAMBDA = 1;

let random: Random;
let responseTime: number;

// Create a new express application instance
const app: express.Application = express();

// Seed init
const seed = process.env.SEED
if (seed === undefined) {
    // Auto initialize seed
    random = new Random(MersenneTwister19937.autoSeed());
} else {
    // Use value provided as env variable
    random = new Random(MersenneTwister19937.seed(parseInt(seed)));
}

// Set server response time
const staticResponseTime = process.env.STATIC_RESPONSE_TIME;
if (staticResponseTime === undefined) {
    responseTime = getRandomResponseTime();
} else {
    responseTime = parseInt(staticResponseTime);
}

// Port configuration
const port = process.env.PORT
if (port === undefined) {
    console.error('Server port must be specified.')
    process.exit(1)
}

app.get('/', function (req, res) {
    setTimeout(() => {
        res.status(200).send();
    }, responseTime);
});

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});

/**
 * Generate a random number from an exponential distribution.
 */
function getRandomResponseTime(): number {
    const value = random.realZeroToOneInclusive();
    return -Math.log(value) / LAMBDA
}