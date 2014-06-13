'use strict';
var assert        = require('assert-plus');
var za            = require('../../za');
var postBody      = require('./body-fixtures').jsonBody;
var responses     = require('./response-fixtures');

var server        = za();

server = za();

server.get('/', function (req, res) {
    res.json(responses.shortJson);
});

server.post('/json', function (req, res) {
    res.json(req.body);
});

server.post('/urlencoded', function (req, res) {
    res.json(req.body);
});

server.get('/middleware', function (req, res) {
    res.json(req.middle);
});

server.use('/middleware', function (req, res, next) {
    req.middle = [1];
    next();
});

server.use('/middleware', function (req, res, next) {
    req.middle.push(2);
    next();
});

server.get('/query', function (req, res) {
    var q = req.query;
    q.hello = q.hello;
    res.json(q);
});

server.post('/file', function (req, res) {
    var busboy = req.files;
    assert.ok(req.files);
    var fileInfo;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      file.on('data', function(data) {

      });
      file.on('end', function() {
        fileInfo = filename;
      });
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {

    });

    busboy.on('finish', function() {
      res.send(fileInfo);
    });
});

module.exports = server;