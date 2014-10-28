var http = require('http');
var parse = require('./parse');

var proto = http.IncomingMessage.prototype;

proto.header = function (name) {
  return this.headers[(name || '').toLowerCase()];
};

if (!proto.hasOwnProperty('cookies')) {
  Object.defineProperty(proto, 'cookies', {
    enumerable: false,
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

if (!proto.hasOwnProperty('query')) {
  Object.defineProperty(proto, 'query', {
    enumerable: false,
    get: function () {
      var query = parse(this.queryString);
      this.query = query;
      return query;
    }
  });
}

if (!proto.hasOwnProperty('body')) {
  Object.defineProperty(proto, 'body', {
    enumerable: false,
    get: function () {
      return this.multipart || parse(this.buffer);
    }
  });
}
