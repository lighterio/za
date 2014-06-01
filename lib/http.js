var http = require('http');

// TODO: Benchmark zlib performance against node-compress.
var zlib = require('zlib');

http.ServerResponse.prototype.json = function (object) {
  var response = this;
  response.statusCode = 200;
  response.setHeader('content-type', 'text/json');
  var json = JSON.stringify(object);

  // TODO: Determine whether 1e3 is the right threshold.
  if (json.length > 1e3) {
    var request = response.request;
    if (request && /\bgzip\b/.test(request.headers['accept-encoding'])) {
      zlib.gzip(json, function (err, gzipped) {
        if (err) {
          response.end(json);
        }
        else {
          response.setHeader('content-encoding', 'gzip');
          response.end(gzipped);
        }
      });
      return;
    }
  }
  response.end(json);
};

http.ServerResponse.prototype.cookie = function (name, value, options) {
  this.setHeader('set-cookie', name + '=' + escape(value));
};

http.ServerResponse.prototype.redirect = function (location) {
  this.statusCode = 302;
  this.setHeader('location', location);
  this.end();
};

http.IncomingMessage.header = function (name) {
  name = name || '';
  return this.headers[name.toLowerCase()];
};
