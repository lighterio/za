var multipart = require('./multipart');
var doNothing = function () {};

// Maximum number of bytes we can receive (to avoid storage attacks).
var MAX_BYTES = 1e8; // ~100MB.

/**
 * Turn a string into a RegExp pattern if it has asterisks.
 */
function patternify(str, start, end) {
  if (typeof str == 'string') {
    str = str.toLowerCase();
    if (str.indexOf('*') > -1) {
      str = str.replace(/\*/g, '@');
      str = str.replace(/([^\d\w_-])/gi, '\\$1');
      str = str.replace(/\\@/g, '.*');
      return new RegExp(start + str + end, 'i');
    }
  }
  return str;
}

/**
 * A Lighter Router sets up HTTP routing.
 */
module.exports = function Router(protocol) {
  this.protocol = protocol;

  var app;

  // Paths are keys/items on/in the routes array.
  var routes = this.routes = {};

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

  /**
   * Add a function to handle a specific HTTP method and URL path.
   */
  this.add = function add(method, path, fn) {
    method = method.toUpperCase();
    path = patternify(path, '^', '$');
    var map = routes[method] = routes[method] || [];

    // Map a pattern with "@", and add to the list of patterns.
    if (path instanceof RegExp) {
      map.push(path);
      map['@' + path] = fn;
    }
    // Or map a path directly.
    else {
      map[path] = fn;
    }
  };

  /**
   * Add a middleware, with an optional path.
   */
  this.use = function use(path, fn) {
    var middleware;
    if (typeof path == 'function') {
      middleware = path;
    }
    else {
      path = patternify(path, '^', '');
      if (path instanceof RegExp) {
        middleware = function (request) {
          var isMatch = path.test(request.url);
          return isMatch ? fn.apply(app, arguments) : true;
        };
      }
      else {
        middleware = function (request) {
          var isMatch = (request.url.indexOf(path) === 0);
          return isMatch ? fn.apply(app, arguments) : true;
        };
      }
    }
    middlewares.push(middleware);
  };

  /**
   * Process a request and write to the response.
   */
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
    var i = 0;

    /**
     * Iterate over middlewares that return truthy values.
     * Wait for falsy-returning middlewares to call `next`.
     */
    function next() {
      var ok, fn;
      do {
        fn = m[i++];
        if (fn) {
          ok = fn.call(app, request, response, next);
        }
        else {
          return finish();
        }
      } while (ok);
    }

    /**
     * Finish the request.
     */
    function finish() {
      var method = request.method;

      // TODO: Add automagic support for CONNECT/OPTIONS/TRACE?
      if (method == 'HEAD') {
        method = 'GET';
        response.write = doNothing;
      }
      var map = routes[method] || routes.GET;
      var fn = map[url];

      // If the path didn't map to a route, iterate over wildcard routes.
      if (!fn) {
        for (var i = 0, l = map.length; i < l; i++) {
          var p = map[i];
          if (p.test(url)) {
            fn = map['@' + p];
            break;
          }
        }
      }

      if (fn) {
        if (method[0] == 'P') {
          var maxBytes = fn._MAX_BYTES || MAX_BYTES;
          if (/multipart/.test(request.headers['content-type'])) {
            request.multipart = {};
            fn(request, response);
            multipart(request, response, maxBytes);
          }
          else {
            var buffer;
            buffer = '';
            request.on('data', function (data) {
              buffer += data;
              if (buffer.length > maxBytes) {
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
      else if (response.error) {
        response.error(404);
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