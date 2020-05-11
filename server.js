"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
// Create a new express application instance
var app = express();
app.get('/', function (req, res) {
    res.send('Hello World!');
});
var port = process.env.PORT;
app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});
