var http = require('http');

// native escape is deprecated since ECMAScript v3.
// using nodjes querystring module escape function instead
var escape = require('querystring').escape;

// TODO: Benchmark zlib performance against node-compress.
var zlib = require('zlib');

http.ServerResponse.prototype.json = function (object) {
  var json = JSON.stringify(object);
  var res = this;
  res.statusCode = 200;
  res.setHeader('content-type', 'text/json');
  res.send(json);
};

http.ServerResponse.prototype.send = function (thing) {
  var res = this;
  var type = typeof thing;
  if (type == 'string') {
    res.zip(thing);
  }
  else if (type == 'number') {
    var status = http.STATUS_CODES[thing];
    res.statusCode = thing;
    res.setHeader('content-type', 'text/json');
    res.end(status || 'Undefined');
  }
  else {
    var json = JSON.stringify(thing);
    res.zip(json);
  }
};

http.ServerResponse.prototype.zip = function (text, preZipped) {
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

http.ServerResponse.prototype.cookie = function (name, value, options) {
  var res = this;
  res.setHeader('set-cookie', name + '=' + escape(value));
};

http.ServerResponse.prototype.redirect = function (location) {
  var res = this;
  res.statusCode = 302;
  res.setHeader('location', location);
  res.end();
};

http.IncomingMessage.header = function (name) {
  return this.headers[(name || '').toLowerCase()];
};
