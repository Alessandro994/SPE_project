import express = require('express');

// Create a new express application instance
const app: express.Application = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

const port = process.env.PORT

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});