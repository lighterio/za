var http = require('http');
var escape = require('querystring').escape;
// TODO: Benchmark zlib performance against node-compress.
var zlib = require('zlib');

var proto = http.ServerResponse.prototype;

proto.json = function (object) {
  var json = JSON.stringify(object);
  var res = this;
  res.setHeader('content-type', 'application/json');
  res.send(json);
};

proto.send = function (data) {
  var res = this;
  var type = typeof data;
  if (type == 'string') {
    res.zip(data);
  }
  else if (type == 'number') {
    var status = http.STATUS_CODES[data];
    res.statusCode = data;
    res.setHeader('content-type', 'application/json');
    res.end(status || 'Undefined');
  }
  else {
    var json = JSON.stringify(data);
    res.zip(json);
  }
};

proto.zip = function (text, preZipped) {
  // TODO: Determine whether 1e3 is the right threshold.
  var res = this;
  if (preZipped || (text.length > 1e3)) {
    var req = res.request;
    if (req && /\bgzip\b/.test(req.headers['accept-encoding'])) {
      if (preZipped) {
        res.setHeader('content-encoding', 'gzip');
        res.end(preZipped);
      }
      else {
        zlib.gzip(text, function (err, zipped) {
          if (err) {
            console.log(err);
            res.end(text);
          }
          else {
            res.setHeader('content-encoding', 'gzip');
            res.end(zipped);
          }
        });
      }
      return;
    }
  }
  res.end(text);
};

proto.cookie = function (name, value, options) {
  var res = this;
  res.setHeader('set-cookie', name + '=' + escape(value));
};

proto.redirect =
proto.redirect || function (location) {
  var res = this;
  res.statusCode = 302;
  res.setHeader('location', location);
  res.end();
};
