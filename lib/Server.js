var Router = require('./Router');
var protocols = ['http', 'https'];

/**
 * The Za server is an http/https web server.
 */
module.exports = function Server() {

  // Za can stand alone if it needs to.
  this.app = this;

  // Or it can be part of a Lighter app.
  this.setApp = function setApp(app) {
    this.app = app;
    for (var key in this.routers) {
      this.routers[key].setApp(app);
    }
  };

  this.routers = {
    http: new Router('http'),
    https: new Router('https')
  };

  this._addRoute = function _addRoute(method, path, callback, protocol) {
    var self = this;
    var isRouted = false;
    protocols.forEach(function (p) {
      if (!protocol || (protocol == p)) {
        if (self.routers[p]) {
          isRouted = true;
          self.routers[p].add(method, path, callback);
        }
      }
    });
    if (!isRouted) {
      throw "Could not route " + method + " to " + path +  " over " + (protocol || protocols.join(' or ')) + ".";
    }
  };

  this.get = function get(path, callback, protocol) {
    this._addRoute('GET', path, callback, protocol);
    return this;
  };

  this.put = function get(path, callback, protocol) {
    this._addRoute('PUT', path, callback, protocol);
    return this;
  };

  this.post = function get(path, callback, protocol) {
    this._addRoute('POST', path, callback, protocol);
    return this;
  };

  this.delete = function get(path, callback, protocol) {
    this._addRoute('DELETE', path, callback, protocol);
    return this;
  };

  this.use = function use(path, middleware, protocol) {
    var self = this;
    var isUsing = false;
    protocols.forEach(function (p) {
      if (!protocol || (protocol == p)) {
        if (self.routers[p]) {
          self.routers[p].use(path, middleware);
          isUsing = true;
        }
      }
    });
    if (!isUsing) {
      throw "Could not use middleware over " + (protocol || protocols.join(' or ')) + ".";
    }
  };

  this.listen = function listen(httpPort, httpsPort) {
    var self = this;
    var ports = arguments;
    protocols.forEach(function (protocol, index) {
      var port = ports[index];
      if (port) {
        var router = self.routers[protocol];
        router.setPort(port);
        var server = require(protocol).createServer(router.serve);
        router.setServer(server);
        server.listen(port);
      }
      else {
        delete self.routers[protocol];
      }
    });
    return self;
  };

  this.close = function close() {
    var self = this;
    protocols.forEach(function (protocol) {
      var router = self.routers[protocol];
      if (router) {
        router.server.close();
      }
    });
    return self;
  };

  /**
   * returns requestListener compatible interface -> function (req, res)
   * which can be used to create server using node http or https require
   *
   * It is useful to have an easy interface to get request listener without knowing za's inside
   * It is also useful to setup a testing environment using supertest
   * @see  https://github.com/visionmedia/supertest
   * @see http://nodejs.org/api/http.html#http_http_createserver_requestlistener
   *
   * @param  {[type]} protocol            za server contains routers for multiple protocol. specify protocol to choose specific za router to be returned as requestListener
   * @return {[requestListener]}          interface function (request, response)
   */
  this.requestListener = function requestListener(protocol) {
    protocol = protocol || 'http';          // default protocol
    var router = this.routers[protocol];
    return router.serve.bind(this);
  };

};
