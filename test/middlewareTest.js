var http = require('http');
var Server = require('../lib/Server');
var app;

// TODO: Move middleware-related tests here.
describe('Middleware', function () {

  before(function () {
    app = new Server({http: 9876});
  });

  after(function () {
    app.close();
  });

  it('gets added with .use()', function (done) {
    var count = 0;
    app.use('/test', function (request, response, next) {
      count++;
      next();
    });
    app.get('/test/ok', function (request, response) {
      response.end('ok' + count);
    });
    http
      .get('http://127.0.0.1:9876/test/ok', function (response) {
        response.on('data', function (data) {
          is('ok1', '' + data);
          done();
        });
      })
      .on('error', done);
  });

  it('gets removed with .unuse()', function (done) {
    var count = 0;
    var middleFn = function (request, response, next) {
      count++;
      is.fail('Should not get here!');
      next();
    };
    app.use('/untest', middleFn);
    app.unuse(middleFn);
    app.get('/untest/ok', function (request, response) {
      response.end('ok' + count);
    });
    http
      .get('http://127.0.0.1:9876/untest/ok', function (response) {
        response.on('data', function (data) {
          is('ok0', '' + data);
          done();
        });
      })
      .on('error', done);
  });

});
