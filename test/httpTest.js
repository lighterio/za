// Import section
var assert      = require('assert-plus');
var request     = require('supertest');
var http        = require('http');
var za          = require('../za');

// TODO: organize test fixtures and test suites
describe('http', function () {
    // Fixtures
    var server;
    var unzipped = '';
    var jsonBody = {
        hello: 'world',
        more: 'field',
        morenum: '23',
        array: [ 1, 3, 4, 5 ],
        inner: {
            fields: 1,
            name: 'hello'
        }
    };
    var longJsonBody = {};

    // Http Code to be tested for http.send method
    var codes = [200, 401, 500];

    before(function () {
        server = za();

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
            res.zip('aaa');
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
    });

    describe('zip', function () {
        it('should return zipped content', function (done) {
            request(server.requestListener()).get('/zip')
                    .set('accept-encoding', 'gzip')
                    .expect('content-encoding', 'gzip')
                    .end(function (err, res) {
                        assert.ok(!err);
                        done();
                    });
        });

        it('should return unzipped content for short input', function (done) {
            request(server.requestListener()).get('/unzipped')
                    .set('accept-encoding', 'gzip')
                    .expect(function (res) {
                        assert.ok(!res.headers['content-encoding']);
                    })
                    .end(function (err, res) {
                        assert.ok(!err);
                        done();
                    });
        });
    });

    describe('json', function () {
        it('should return unzipped json content', function (done) {
            request(server.requestListener()).get('/json')
                    .set('accept-encoding', 'gzip')
                    .expect(function (res) {
                        assert.ok(!res.headers['content-encoding']);
                    })
                    .expect(JSON.stringify(jsonBody))
                    .end(function (err, res) {
                        assert.ok(!err);
                        done();
                    });
        });

        it('should return zipped json content', function (done) {
            request(server.requestListener()).get('/jsonzip')
                    .set('accept-encoding', 'gzip')
                    .expect('content-type', /json/)
                    .expect('content-encoding', /gzip/, done);
        });
    });
    describe('send', function () {

        // Testing send with a number
        codes.forEach(function (code) {
            it('should return status code ' + code, function (done) {
                request(server.requestListener()).get('/send/' + code)
                        .expect('content-type', /json/)
                        .expect(parseInt(code))
                        .expect(http.STATUS_CODES[code])
                        .end(done);

            });
        });

        // Testing send with object
        it('should return a parsed json object as a string', function (done) {
            request(server.requestListener()).get('/send/json')
                    .expect(200)
                    .expect(JSON.stringify(jsonBody))
                    .end(done);
        });

        it('should have header sent from a request', function (done) {
            request(server.requestListener()).get('/header')
                    .set('content-type', 'application/custom')
                    .expect('application/custom')
                    .expect(200)
                    .end(done);
        });

        it('should have cookie set from the rquest', function (done) {
            request(server.requestListener()).get('/cookie')
                    .expect(200)
                    .expect('set-cookie', 'coo=kie')
                    .end(done);
        });

        it('should redirect the request', function (done) {
            request(server.requestListener()).get('/redirect')
                    .expect(302)
                    .expect('location', 'http://google.com')
                    .end(done);
        });

    });

});