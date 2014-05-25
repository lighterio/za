var http = require('http');

http.ServerResponse.prototype.json = function httpResponseJson(object) {
	this.statusCode = 200;
	this.setHeader('content-type', 'text/json');
	var json = JSON.stringify(object);
	this.end(json);
};

http.ServerResponse.prototype.cookie = function httpResponseCookie(name, value, options) {
	this.setHeader('set-cookie', name + '=' + escape(value));
};
