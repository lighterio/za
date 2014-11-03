var Router = require('./Router');
var parse = require('./parse');
var http = require('http');
var https = require('https');
var protocols = ['http', 'https'];
var defaultPort = 8080;

/**
 * A Za Server is a fast, simple HTTP + HTTPS server.
 */
var Server = module.exports = function (config) {
  var self = this;

  // Za can have a parent `app`, but it defaults to being its own app.
  self.app = this;

  // The server does not take requests until the `listen` method is called.
  self.isListening = false;

  // The `routers` method returns an array, optionally filtered by protocol.
  var routers = self.routers = function (protocol) {
    if (self.isListening) {
      var list = [];
      protocols.forEach(function (p) {
        if ((!protocol || (protocol == p)) && routers[p]) {
          list.push(routers[p]);
        }
      });
      return list;
    }
    else {
      return protocol ? [routers[protocol]] : routers.list;
    }
  };

  // The `routers` property is also a map.
  routers.http = new Router('http');
  routers.https = new Router('https');
  routers.list = [routers.http, routers.https];

  // If configuration is passed in, start listening.
  if (config) {
    self.listen(config);
  }

};

/**
 * Za servers share chainable methods.
 */
var proto = Server.prototype = {

  /**
   * Inject a parent app (such as Lighter MVC).
   */
  setApp: function (app) {
    this.app = app;
    this.routers().forEach(function (router) {
      router.setApp(app);
    });
    var logger = app.logger;
    if (logger && logger.warn) {
      parse.logger = logger;
    }
    return this;
  },

  /**
   * Set an HTTP method to route a path to a function.
   */
  route: function (method, path, fn, protocol) {
    var routers = this.routers(protocol);
    this.routers(protocol).forEach(function (router) {
      router.add(method, path, fn);
    });
    return this;
  },

  /**
   * Set a middleware function to be used, optionally on a given path.
   */
  use: function (path, fn, protocol) {
    this.routers(protocol).forEach(function (router) {
      router.use(path, fn);
    });
    return this;
  },

  /**
   * Remove a middleware function from usage.
   */
  unuse: function (fn, protocol) {
    this.routers(protocol).forEach(function (router) {
      router.unuse(fn);
    });
    return this;
  },

  /**
   * Listen for HTTP/HTTPS requests based on a `config` object.
   * For example:
   * ```json
   * {
   *    http: 80,
   *    https: 443, // Optional.
   *    key: '/private/key.pem', // Optional unless `https` is set.
   *    cert: 'private/cert.pem' // Optional unless `https` is set.
   *  }
   * ```
   */
  listen: function (config) {
    var self = this;
    var args = arguments;
    config = config || 0;
    var ssl = {
      key: config.key ? fs.readFileSync(config.key) : 0,
      cert: config.cert ? fs.readFileSync(config.cert) : 0
    };
    var routers = self.routers;
    routers.list = [];
    protocols.forEach(function (protocol, i) {
      // Support `listen(httpPort, httpsPort, httpsOptions)` for backward compatibility.
      var port = config[protocol] || args[i] || (i ? 0 : defaultPort++);
      if (port) {
        var router = routers[protocol] || new Router(protocol);
        var lib = require(protocol);
        var server = i ?
          lib.createServer(ssl, router.serve) :
          lib.createServer(router.serve);
        routers[protocol] = router;
        router.setServer(server);
        server.listen(port);
        self.isListening = true;
        routers.list.push(router);
      }
      else {
        delete routers[protocol];
      }
    });
    return self;
  },

  /**
   * Shut the server down by stopping its routers' servers.
   */
  close: function () {
    var self = this;
    if (self.isListening) {
      self.routers().forEach(function (router) {
        router.server.close();
      });
    }
    self.isListening = false;
    return self;
  },

  /**
   * Get a requestListener-compatible interface.
   * @see https://github.com/visionmedia/supertest
   * @see http://nodejs.org/api/http.html#http_http_createserver_requestlistener
   */
  requestListener: function (protocol) {
    var self = this;
    return self.routers(protocol)[0].serve.bind(self);
  }

};

// Create HTTP method properties so that (e.g.) `app.get('/', fn)` can be called.
['CONNECT', 'DELETE', 'GET', 'HEAD',
  'OPTIONS', 'POST', 'PUT', 'TRACE'].forEach(function (method) {
  var key = method.toLowerCase();
  proto[key] = function (path, fn, protocol) {
    return this.route(method, path, fn, protocol);
  };
});
