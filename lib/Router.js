var qs = require('qs');
var parsers = require('./parsers');
var paths;
var patterns;

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
    var cookies = request.cookies = {};
    var cookie = request.headers.cookie;
    if (cookie) {
      cookie.split(/; ?/).forEach(function (pair) {
        pair = pair.split('=');
        cookies[pair[0]] = decodeURIComponent(pair[1]);
      });
    }

    var url = request.url;
    if (url.indexOf('?') > -1) {
      var parts = url.split('?');
      request.path = parts[0];
      request.query = qs.parse(parts[1]);
    } else {
      request.path = url;
      request.query = {};
    }
    url = request.path.toLowerCase();

    var middlewareCount = middlewares.length;
    var middlewareIndex = -1;

    function next() {
      if (++middlewareIndex < middlewareCount) {
        middlewares[middlewareIndex].call(app, request, response, next);
      }
      else {
        finish();
      }
    }

    function finish() {
      var callback = paths[request.method][url];
      if (callback) {
        if (request.method === 'POST' || request.method === 'PUT') {
            parsers.call(app, request, response, function (err) {
              if (err) {
                throw err;
              }
              callback.call(app, request, response);
            });
        } else {
          callback.call(app, request, response);
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
