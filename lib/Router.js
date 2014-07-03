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

  this.add = function add(method, path, callback) {
    path = path.toLowerCase();
    if (path.indexOf('*') > -1) {
      throw "Za routing does not yet support wildcards in paths. Cannot route " + path + ".";
    }
    else {
      paths[method][path] = callback;
    }
  };

  this.use = function use(path, callback) {
    var middleware;
    if (typeof path == 'function') {
      middleware = path;
    }
    else {
      var length = path.length;
      middleware = function (request, response, next) {
        if (request.url.substr(0, length) == path) {
          callback.call(app, request, response, next);
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
      var callback = paths[request.method][url];
      if (callback) {
        if (request.method[0] == 'P') {
          var buffer;
          if (/multipart/.test(request.headers['content-type'])) {
            callback(request, response);
            multipart(request, MAX_BYTES);
          }
          else {
            buffer = '';
            request.on('data', function (data) {
              buffer += data;
              // Don't allow users to post more than ~100MB.
              if (buffer.length > MAX_BYTES) {
                request.connection.destroy();
              }
            });
            request.on('end', function () {
              request.buffer = buffer;
              callback(request, response);
            });
          }
        }
        else {
          callback(request, response);
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
