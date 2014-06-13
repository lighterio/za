// Import section
var assert      = require('assert-plus');
var za          = require('../za');
var request     = require('supertest');
var qs          = require('qs');
var zlib        = require('zlib');
var http        = require('http');

describe('Server', function () {
    var testServer = require('./fixtures/server-test-server');
    var bodies = require('./fixtures/body-fixtures');
    var response = require('./fixtures/response-fixtures');

    it('should throw error for unsupported protocol route', function () {
        try {
            testServer.get('/', function (req, res) {
                res.send('something');
            }, 'gmarket');
        } catch (e) {
            return;
        }
        assert.fail();
    });

    it('should return requestListener', function () {
        assert.equal(testServer.requestListener().length, 2);
    });

    it('should set app', function () {
        testServer.setApp(testServer);
    });

    it('should listen to za', function (done) {
        var server = testServer.listen(8080);
        assert.deepEqual(server, testServer);

        var opt = {
            hostname: 'localhost',
            port: 8080,
            path: '/',
            agent: false
        };

        http.get(opt, function (res) {
            var body = '';
            res.on('data', function (data) {
                body += data;
            });

            res.on('end', function () {
                assert.deepEqual({ hello: 'world' }, JSON.parse(body));
                done();
            });

            res.on('error', function (err) {
                done(err);
            });
        });
    });

    it('should close', function (done) {
        testServer.close();

        var opt = {
            hostname: 'localhost',
            port: 8080,
            path: '/',
            agent: false
        };

        http.get(opt, function (res) {
            var body = '';

            res.on('data', function (data) {
                body += data;
            });

            res.on('end', function () {
                done(new Error());
            });

            res.on('error', function (err) {
                assert.ok(err);
                done();
            });
        })
        .on('error', function (err) {
            assert.ok(err);
            done();
        });
    });
});
