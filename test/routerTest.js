var request         = require('supertest');
var qs              = require('qs');
var server          = require('./fixtures/router-test-server');
var bodies          = require('./fixtures/body-fixtures');
var responses       = require('./fixtures/response-fixtures');

describe('Router', function () {

  describe('middlewares', function () {
    it('execute in order', function (done) {
      request(server.requestListener())
        .get('/middleware')
        .send()
        .expect(200)
        .expect(JSON.stringify([1,2]))
        .end(done);
    });
    it('support async mode', function (done) {
      request(server.requestListener())
        .get('/async')
        .send()
        .expect(200)
        .expect(JSON.stringify([1,2]))
        .end(done);
    });
    it('support sync mode', function (done) {
      request(server.requestListener())
        .get('/sync')
        .send()
        .expect(200)
        .expect(JSON.stringify([1,3]))
        .end(done);
    });
    it('support wildcards', function (done) {
      request(server.requestListener())
        .get('/sync/me/ok')
        .send()
        .expect(200)
        .expect(JSON.stringify([1,3,4]))
        .end(done);
    });
  });

  describe('@requestListener', function () {
    it('should return requestListener', function () {
      var listener = server.requestListener('http');
      is.function(listener);
      is.lengthOf(listener, 2);
    });
  });

  describe('.serve', function () {

    it('should return a 404 if the route is not found', function (done) {
      request(server.requestListener()).get('/notfound')
        .expect(404)
        .end(done);
    });

    it('should parse query params', function (done) {
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

  describe('wildcards', function () {
    it('match anything', function (done) {
      request(server.requestListener())
       .get('/wild/hello')
       .send()
       .expect('{"wild":"hello"}')
       .end(done);
    });
    it('can appear in the middle', function (done) {
      request(server.requestListener())
       .get('/something/profile')
       .send()
       .expect('{"profile":"something"}')
       .end(done);
    });
  });

});
