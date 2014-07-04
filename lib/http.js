var http = require('http');
var escape = require('querystring').escape;

// TODO: Benchmark zlib performance against node-compress.
var zlib = require('zlib');

http.ServerResponse.prototype.json = function (object) {
  var json = JSON.stringify(object);
  var res = this;
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
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
    res.setHeader('content-type', 'application/json');
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

http.ServerResponse.prototype.redirect =
http.ServerResponse.prototype.redirect || function (location) {
  var res = this;
  res.statusCode = 302;
  res.setHeader('location', location);
  res.end();
};

http.IncomingMessage.prototype.header = function (name) {
  return this.headers[(name || '').toLowerCase()];
};

Object.defineProperty(http.IncomingMessage.prototype, 'cookies', {
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

function parse(string) {
  var data;
  if (typeof string == 'string') {
    if (string[0] == '{') {
      try {
        data = JSON.parse(string);
      }
      catch (e) {
        this.logger.error(e.stack);
        this.logger.log(buffer);
      }
    }
    else {
      data = {};
      string.split('&').forEach(function (pair) {
        pair = pair.split('=');
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        var isObjectOrArray = false;
        var subKey = null;
        key = key.replace(/\[([^\]]*)\]$/, function (match, inner) {
          isObjectOrArray = true;
          subKey = inner;
          return '';
        });
        if (isObjectOrArray) {
          data[key] = data[key] || ((subKey && isNaN(subKey)) ? {} : []);
          subKey = subKey || data[key].length;
          data[key][subKey] = value;
        }
        else {
          data[key] = value;
        }
      });
    }
  }
  return data || {};
}

Object.defineProperty(http.IncomingMessage.prototype, 'query', {
  get: function () {
    return parse(this.queryString);
  }
});

Object.defineProperty(http.IncomingMessage.prototype, 'body', {
  get: function () {
    var buffer = this.buffer;
    if (buffer instanceof Buffer) {
      return {};
    }
    else {
      return parse(buffer);
    }
  }
});
