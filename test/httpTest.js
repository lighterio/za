var request = require('supertest');
var http = require('http');
var server = require('./fixtures/http-test-server');
var responses = require('./fixtures/response-fixtures');
var jsonBody = responses.shortJson;
var codes = server.codes;

describe('http', function () {

  it('supports HEAD', function (done) {
    request(server.requestListener()).head('/send/json')
      .expect(200)
      .expect('')
      .end(done);
  });

  describe('zip', function () {
    it('returns zipped content', function (done) {
      request(server.requestListener()).get('/zip')
        .set('accept-encoding', 'gzip')
        .expect('content-encoding', 'gzip')
        .end(function (err, res) {
          is.null(err);
          done();
        });
    });

    it('returns unzipped content for short input', function (done) {
      request(server.requestListener()).get('/unzipped')
        .set('accept-encoding', 'gzip')
        .expect(function (res) {
          is.undefined(res.headers['content-encoding']);
        })
        .end(function (err, res) {
          is.null(err);
          done();
        });
    });
  });

  describe('json', function () {
    it('returns unzipped json content', function (done) {
      request(server.requestListener()).get('/json')
        .set('accept-encoding', 'gzip')
        .expect(function (res) {
          is.undefined(res.headers['content-encoding']);
        })
        .expect(JSON.stringify(jsonBody))
        .end(function (err, res) {
          is.null(err);
          done();
        });
    });

    it('returns zipped json content', function (done) {
      request(server.requestListener()).get('/jsonzip')
        .set('accept-encoding', 'gzip')
        .expect('content-type', /json/)
        .expect('content-encoding', /gzip/, done);
    });
  });
  describe('send', function () {

    codes.forEach(function (code) {
      it('returns status code ' + code, function (done) {
        request(server.requestListener()).get('/send/' + code)
          .expect('content-type', /json/)
          .expect(parseInt(code))
          .expect(http.STATUS_CODES[code])
          .end(done);

      });
    });

    it('writes json', function (done) {
      request(server.requestListener()).get('/send/json')
        .expect(200)
        .expect(JSON.stringify(jsonBody))
        .end(done);
    });

    it('sets headers', function (done) {
      request(server.requestListener()).get('/header')
        .set('content-type', 'application/custom')
        .expect('application/custom')
        .expect(200)
        .end(done);
    });

    it('sets a cookie', function (done) {
      request(server.requestListener()).get('/cookie')
        .expect(200)
        .expect('set-cookie', 'coo=kie')
        .end(done);
    });

    it('redirects', function (done) {
      request(server.requestListener()).get('/redirect')
        .expect(302)
        .expect('location', 'http://google.com')
        .end(done);
    });

  });

});
