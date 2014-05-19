var http = require('http');
var https = require('https');
var Router = require('./Router');

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
		var isRouted = false;
		if (!protocol || (protocol == 'http')) {
			if (this.routers.http.port) {
				isRouted = true;
				this.routers.http.add(method, path, callback);
			}
		}
		if (!protocol || (protocol == 'https')) {
			if (this.routers.https.port) {
				isRouted = true;
				this.routers.https.add(method, path, callback);
			}
		}
		if (!isRouted) {
			throw "Could not route " + method + " to " + path +  " over " + (protocol || "http or https") + ".";
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

	this.use = function use(path, callback, protocol) {
		var methods = ['GET', 'PUT', 'POST', 'DELETE'];
		methods.forEach(function (method) {
			this._addRoute(method, path, callback, protocol);
		});
		return this;
	};

	this.listen = function listen(httpPort, httpsPort) {
		if (httpPort) {
			this.routers.http.setPort(httpPort);
			http.createServer(this.routers.http.serve).listen(httpPort);
		}
		if (httpsPort) {
			this.routers.https.setPort(httpsPort);
			https.createServer(this.routers.https.serve).listen(httpsPort);
		}
		return this;
	};

};
