'use strict';
var assert          = require('assert-plus');
var request         = require('supertest');
var qs              = require('qs');
var server          = require('./fixtures/router-test-server');
var bodies          = require('./fixtures/body-fixtures');
var responses       = require('./fixtures/response-fixtures');

describe('Server', function () {

    it('should execute middleware', function (done) {
        request(server.requestListener()).get('/middleware')
            .expect(200)
            .expect(JSON.stringify([1,2]), done);
    });


    describe('@requestListener', function () {

        it('should return requestListener', function () {
            var listener = server.requestListener('http');

            assert.func(listener, 'listener');
            assert.ok(listener.length === 2);
        });
    });

    describe('router', function () {
        it('should return 404 response', function (done) {
            request(server.requestListener()).get('/notfound')
                .expect(404)
                .end(done);
        });

        it('should parse query param', function (done) {
            var queryObj = {
                hello: '12',
                world: 'too',
                array: ['some', 'array', 'value', 'oiu']
            };

            var query = qs.stringify(queryObj);
            request(server.requestListener()).get('/query?' + query)
                    .expect(JSON.stringify(queryObj))
                    .end(done);
        });
    });


    describe('body parser', function () {

        it('should parse passed json body', function (done) {
            request(server.requestListener())
                   .post('/json')
                   .set('Content-Type', 'application/json')
                   .send(JSON.stringify(bodies.jsonBody))
                   .end(done);
        });

        it('should parse urlencoded post body', function (done) {
            request(server.requestListener())
                   .post('/urlencoded')
                   .send(bodies.formBody)
                   .end(done);
        });
    });
});
