var qs = require('qs');
var paths;
var patterns;

/**
 * A Lighter Router sets up HTTP routing.
 */
module.exports = function Router(protocol) {
  this.protocol = protocol;

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

  var app = this.app;

  this.setApp = function setApp(value) {
    app = this.app = value;
  };

  this.setPort = function setPort(port) {
    this.port = port;
  };

  this.add = function add(method, path, callback) {
    path = path.toLowerCase();
    if (path.indexOf('*') > -1) {
      throw "Za routing does not yet support wildcards in paths. Cannot route " + path + "."
    } else {
      paths[method][path] = callback;
    }
  };

  this.use = function use(middleware) {
    middlewares.push(middleware)
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
      request.url = parts[0];
      request.query = qs.parse(parts[1]);
    } else {
      request.query = {};
    }
    url = request.url.toLowerCase();

    var middlewareCount = middlewares.length;
    var middlewareIndex = -1;

    function next() {
      if (++middlewareIndex < middlewareCount) {
        middlewares[middlewareIndex](request, response, next);
      }
      else {
        finish();
      }
    }

    function finish() {
      var callback = paths[request.method][url];
      if (callback) {

        // Parse the request body if we need to.
        if (request.method == 'POST') {
          var body = '';
          request.on('data', function (data) {
            body += data;
            // Don't allow users to post more than ~1MB.
            if (body.length > 1e6) {
              request.connection.destroy();
            }
          });
          request.on('end', function () {
            request.body = qs.parse(body);
            callback(request, response);
          });
        }
        else {
          request.body = '';
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
