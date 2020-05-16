import express = require('express');
import {MersenneTwister19937, Random} from "random-js";

const SEED = 3;
const LAMBDA = 1;
let responseTime = 0;

// Create a new express application instance
const app: express.Application = express();

const args = process.argv.slice(2);
if (args.length > 0) {
    const random = new Random(MersenneTwister19937.seed(SEED));
    const value = random.realZeroToOneInclusive();
    responseTime = -Math.log(value) / LAMBDA
    console.log('Random response time amounts at ', responseTime);
}

app.get('/', function (req, res) {
    setTimeout(() => {
        res.status(200).send();
    }, responseTime);
});

const port = process.env.PORT

if (port === undefined) {
    console.error('Server port must be specified.')
    process.exit(1)
}

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});