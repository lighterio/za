'use strict';
var za              = require('../../za');
var responses       = require('./response-fixtures');
var bodies          = require('./body-fixtures');
var codes           = [200, 401, 500];
var jsonBody        = responses.shortJson;
var longJsonBody    = responses.longJson;
var unzipped        = responses.longString;
var shortString     = responses.shortString;

var server = za();

while (unzipped.length < 2e3) {
    unzipped += 'a';
}

var i = 0;
while (i++ < 1e3) {
    var key = 'key' + i;
    longJsonBody[key] = 'value' + i;
}

server.get('/zip', function (req, res) {
    res.zip(unzipped);
});

server.get('/unzipped', function (req, res) {
    res.zip(shortString);
});

server.get('/json', function (req, res) {
    res.json(jsonBody);
});

server.get('/jsonzip', function (req, res) {
    res.json(longJsonBody);
});

server.get('/send/400', function (req, res) {
    res.send(400);
});

// making send end with all status code
codes.forEach(function (code) {
    server.get('/send/' + code, function (req, res) {
        res.send(parseInt(code));
    });
});

server.get('/send/json', function (req, res) {
    res.send(jsonBody);
});

server.get('/header', function (req, res) {
    res.send(req.header('content-type'));
});

server.get('/cookie', function (req, res) {
    res.cookie('coo', 'kie');
    res.send(200);
});

server.get('/redirect', function (req, res) {
    res.redirect('http://google.com');
});

module.exports = server;
module.exports.codes = codes;