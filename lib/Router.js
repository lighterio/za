var multipart = require('./multipart');

var paths;
var patterns;

var MAX_BYTES = 1e8; // ~100MB

/**
 * A Lighter Router sets up HTTP routing.
 */
module.exports = function Router(protocol) {
  this.protocol = protocol;

  var app;

  var paths = this.paths = {
    GET: {},
    PUT: {},
    POST: {},
    DELETE: {}
  };

  // TODO: Support routing patterns with wildcards.
  var patterns = this.patterns = {
    GET: {},
    PUT: {},
    POST: {},
    DELETE: {}
  };

  // Middlewares are functions that chain asynchronously.
  var middlewares = this.middlewares = [];

  this.setApp = function setApp(value) {
    app = this.app = value;
  };

  this.setPort = function setPort(port) {
    this.port = port;
  };

  this.setServer = function setServer(server) {
    this.server = server;
  };

  this.add = function add(method, path, fn) {
    path = path.toLowerCase();
    fn._ZA_MAX_BYTES = fn._ZA_MAX_BYTES || MAX_BYTES;
    if (path.indexOf('*') > -1) {
      throw "Za routing does not yet support wildcards in paths. Cannot route " + path + ".";
    }
    else {
      paths[method][path] = fn;
    }
  };

  this.use = function use(path, fn) {
    var middleware;
    if (typeof path == 'function') {
      middleware = path;
    }
    else {
      var length = path.length;
      middleware = function (request, response, next) {
        if (request.url.substr(0, length) == path) {
          fn.call(app, request, response, next);
        }
        else {
          next();
        }
      };
    }
    middlewares.push(middleware);
  };

  this.serve = function (request, response) {
    response.app = app;
    response.request = request;

    var url = request.url;
    if (url.indexOf('?') > -1) {
      var parts = url.split('?');
      url = parts[0];
      request.queryString = parts[1];
    }
    url = url.toLowerCase();

    var m = middlewares;
    var n = m.length;
    var i = -1;

    function next() {
      if (++i < n) {
        m[i].call(app, request, response, next);
      }
      else {
        finish();
      }
    }

    function finish() {
      var fn = paths[request.method][url];
      if (fn) {
        if (request.method[0] == 'P') {
          if (/multipart/.test(request.headers['content-type'])) {
            request.multipart = {};
            fn(request, response);
            multipart(request, response, fn._ZA_MAX_BYTES);
          }
          else {
            var buffer;
            buffer = '';
            request.on('data', function (data) {
              buffer += data;
              if (buffer.length > fn._ZA_MAX_BYTES) {
                request.connection.destroy();
              }
            });
            request.on('end', function () {
              request.buffer = buffer;
              fn(request, response);
            });
          }
        }
        else {
          fn(request, response);
        }
      }
      else if (response.error404) {
        response.error404();
      }
      else {
        response.statusCode = 404;
        response.setHeader('content-type', 'text/html');
        response.end('<h1>Page Not Found</h1>');
      }
    }

    next();
  };
};
