var http = require('http');
var escape = require('querystring').escape;
var parse = require('./parse');

// TODO: Benchmark zlib performance against node-compress.
var zlib = require('zlib');

var requestProto = http.IncomingMessage.prototype;
var responseProto = http.ServerResponse.prototype;

responseProto.json = function (object) {
  var json = JSON.stringify(object);
  var res = this;
  res.setHeader('content-type', 'application/json');
  res.send(json);
};

responseProto.send = function (data) {
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

responseProto.zip = function (text, preZipped) {
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

responseProto.cookie = function (name, value, options) {
  var res = this;
  res.setHeader('set-cookie', name + '=' + escape(value));
};

responseProto.redirect =
responseProto.redirect || function (location) {
  var res = this;
  res.statusCode = 302;
  res.setHeader('location', location);
  res.end();
};

requestProto.header = function (name) {
  return this.headers[(name || '').toLowerCase()];
};

if (!requestProto.hasOwnProperty('cookies')) {
  Object.defineProperty(requestProto, 'cookies', {
    get: function () {
      var cookies = {};
      var cookie = this.headers.cookie;
      if (cookie) {
        cookie.split(/; ?/).forEach(function (pair) {
          pair = pair.split('=');
          cookies[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        });
      }
      this.cookies = cookies;
      return cookies;
    }
  });
}

if (!requestProto.hasOwnProperty('query')) {
  Object.defineProperty(requestProto, 'query', {
    enumerable: false,
    get: function () {
      var query = parse(this.queryString);
      this.query = query;
      return query;
    }
  });
}

if (!requestProto.hasOwnProperty('body')) {
  Object.defineProperty(requestProto, 'body', {
    enumerable: false,
    get: function () {
      return this.multipart || parse(this.buffer);
    }
  });
}
