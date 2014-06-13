// Import section
var assert      = require('assert-plus');
var request     = require('supertest');
var http        = require('http');
var server      = require('./fixtures/http-test-server');
var responses   = require('./fixtures/response-fixtures');
var jsonBody    = responses.shortJson;
var codes       = server.codes;

describe('http', function () {
    // Fixtures
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