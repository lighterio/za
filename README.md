# Za

[![NPM Version](https://badge.fury.io/js/za.png)](http://badge.fury.io/js/za)
[![Build Status](https://travis-ci.org/lighterio/za.png?branch=master)](https://travis-ci.org/lighterio/za)
[![Code Coverage](https://coveralls.io/repos/lighterio/za/badge.png?branch=master)](https://coveralls.io/r/lighterio/za)
[![Dependencies](https://david-dm.org/lighterio/za.png?theme=shields.io)](https://david-dm.org/lighterio/za)
[![Support](http://img.shields.io/gittip/zerious.png)](https://www.gittip.com/lighterio/)

Za is a simple web server that exposes an Express-like API and is capable of
handling far more requests per second than Express.

## Getting Started

Install `za` in your project:

```bash
npm install --save za
```

Use `za` to start an HTTP server:

```javascript
var server = require('./za')();
server.listen(8888);
server.get('/', function (request, response) {
  response.send('Hello World!');
});
console.log('Visit http://localhost:8888/ for "Hello World!"');

```

## Server and Router

### za()

The `za` API is a function which instantiates servers.

```javascript
var za = require('za');
var server1 = za();
var server2 = za();
server1.listen(8001);
server2.listen(8002);
console.log('HTTP servers are listening on 8001 and 8002');
```

### server.listen(httpPort, [httpsPort, httpsOptions])

Za `Server` objects can listen on both HTTP and HTTPS ports.
```javascript
var fs = require('fs');
var server = require('za')();
server.listen(8080, 8443, {
  key: fs.readFileSync('ssl-key.pem'),
  cert: fs.readFileSync('ssl-cert.pem')
});
```

### server.routers

Za exposes its HTTP and HTTPS `Router` objects via `server.routers.http` and
`server.routers.https`. If a router is listening, it has an entry in
`server.routers`, otherwise it doesn't.

### router.use([path,] fn)

The `use` method on a router sets a middleware function, optionally to be
routed only to a given path. The handler function takes `request`, `response`
and `next` arguments. The `request` and `response` arguments are HTTP request
and response objects, and the `next` argument is a function that you should
invoke when you want the next middleware to start executing. For performance
reasons, wildcard paths are not yet supported, but the middleware executes for
any request URLs that **start with** that path.

This can be used for things like logging:

```javascript
server.use(function (request, response, next) {
  console.log('User requested "' + request.url + '"');
  next();
});
```

Or for something like authentication:

```javascript
server.use('/admin', function (request, response, next) {
  if (request.isAdminUser) {
    next();
  } else {
    response.statusCode = 401;
    response.end("You are not signed in as an admin user.");
  }
});
```

### router.get(path, fn)

The `get` method on a router sets a GET handler function for a given
path. The handler function takes `request` and `response` arguments. For
performance reasons, wildcard paths are not yet supported.

```javascript
server.get('/ping', function (request, response) {
  response.end('OK');
});
```

### router.post(path, fn)

Works just like router.get, only the method is POST.

### router.put(path, fn)

Works just like router.get, only the method is PUT.

### router.delete(path, fn)

Works just like router.get, only the method is DELETE.

### server.use(path, fn)

Calls `router.use` on all of the routers that the server has listening.

### server.get(path, fn)

Calls `router.get` on all of the routers that the server has listening.

### server.post(path, fn)

Calls `router.post` on all of the routers that the server has listening.

### server.put(path, fn)

Calls `router.put` on all of the routers that the server has listening.

### server.delete(path, fn)

Calls `router.delete` on all of the routers that the server has listening.

## HTTP object decorations

Za decorates the `http.IncomingMessage` and `http.ServerResponse` prototypes
with useful methods.

### request.header(name)

Returns the value of a response header with the given name.

### request.cookies

Exposes a getter which parses the cookie header and returns an object with
a key and value for each cookie.

### request.body

Exposes a getter which parses the request body and returns an object with a
key and value for each parameter in the POST body.

### request.query

Exposes a getter which parses the query string and returns an object with a
key and value for each URL parameter.

### request.multipart

The `multipart` object has its keys and values set as the server is receiving
multipart form data. If the request is not a multipart type request, this
object will be undefined (so it can be used to test for multipart requests).

### response.json(object)

Sends an object as a JSON string, with `content-type: application/json`.

### response.send(data)

Sends a string, an HTTP status, or an object as a JSON string - depending on
the type of the data (`string`, `number` or `object`).

### response.zip(text, preZipped)

Uses `gzip` to compress text (provided the `accept-encoding` header mentions
"gzip"), then sets `content-encoding: gzip` and sends the response.

NOTE: If `preZipped` is passed in, the `gzip` compression step is skipped, and
the pre-zipped content is used instead. This is a useful performance feature
for when you need to send the same zipped response multiple times.

### response.cookie(name, value, options)

Sets a cookie with a given name, value and options.

### response.redirect(location)

Sends a 302 response, redirecting to the given location.

## Multipart

Za includes its own multipart parser. When a multipart request is received, its
handler is called before the multipart parser begins. The handler can listen
for request events as file parsing proceeds.

### request.on('za:file', fn)

When the multipart parser finds a file, the request emits a `"za:file"` event
and passes the file field. A listener can set a `stream` object on the file
field, and the parser will save to that stream. When the parser is finished, it
will close the stream.

```javascript
server.post('/upload', function (request, response) {
  request.on('za:file', function () {
    var path = '/tmp/upload';
    var encoding = (/text/.test(field.type) ? 'utf8' : 'binary');
    field.stream = fs.createWriteStream(, encoding);
    field.stream.on('close', function () {
      response.send('File "' + field.filename + '" saved to "' + path + '".');
    });
  })
});
```

### request.on('za:finished', fn)

When the multipart parser is finished, the request emits a `"za:finished"`
event. At that time, `request.multipart` (as well as `request.body`) contain
all of the data that was sent in the multipart request.

## Why is it called "Za"?
The term "za" is short for "pizza", and when it comes to web app responses and
pizza, everyone wants fast delivery. (Also, the name was available on NPM).
