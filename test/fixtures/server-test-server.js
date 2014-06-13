'use strict';
var za = require('../../za');

var testServer = new za();

var responseFixture = module.exports.responseFixture = {
    hello: 'world'
};

// adding a middleware
testServer.use('/middle', function middleware(req, res) {
    req._middle  = 1;
});

testServer.get('/', function (req, res) {
    res.json(responseFixture);
});

testServer.post('/', function (req, res) {
    res.json(req.body);
});

testServer.put('/', function (req, res) {
    res.json(req.body);
});

testServer.delete('/', function (req, res) {
    res.send(201);
});

module.exports = testServer;