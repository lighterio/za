# <a href="http://lighter.io/za" style="font-size:40px;text-decoration:none;color:#000"><img src="https://cdn.rawgit.com/lighterio/lighter.io/master/public/za.svg" style="width:90px;height:90px"> Za</a>
[![NPM Version](https://img.shields.io/npm/v/za.svg)](https://npmjs.org/package/za)
[![Downloads](https://img.shields.io/npm/dm/za.svg)](https://npmjs.org/package/za)
[![Build Status](https://img.shields.io/travis/lighterio/za.svg)](https://travis-ci.org/lighterio/za)
[![Code Coverage](https://img.shields.io/coveralls/lighterio/za/master.svg)](https://coveralls.io/r/lighterio/za)
[![Dependencies](https://img.shields.io/david/lighterio/za.svg)](https://david-dm.org/lighterio/za)
[![Support](https://img.shields.io/gratipay/Lighter.io.svg)](https://gratipay.com/Lighter.io/)


## TL;DR

Za is a simple web server that exposes an Express-like API and is capable of
handling far more requests per second than Express.


### Quick Start
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

### request.on("za:file", fn)

When the multipart parser finds a file, the request emits a `"za:file"` event
and passes the file field. A listener can set a `stream` object on the file
field, and the parser will save to that stream. When the parser is finished, it
will close the stream.

```javascript
server.post('/upload', function (request, response) {
  request.on('za:file', function (field) {
    var path = '/tmp/upload';
    var encoding = (/text/.test(field.type) ? 'utf8' : 'binary');
    field.stream = fs.createWriteStream(, encoding);
    field.stream.on('close', function () {
      response.send('File "' + field.filename + '" saved to "' + path + '".');
    });
  });
});
```

### request.on("za:finished", fn)

When the multipart parser is finished, the request emits a `"za:finished"`
event. At that time, `request.multipart` (as well as `request.body`) contain
all of the data that was sent in the multipart request.


## Why is it called "Za"?

The term "za" is short for "pizza", and when it comes to web app responses and
pizza, everyone wants fast delivery. (Also, the name was available on NPM).


## Acknowledgements

We would like to thank all of the amazing people who use, support,
promote, enhance, document, patch, and submit comments & issues.
Za couldn't exist without you.

Additionally, huge thanks go to [TUNE](http://www.tune.com) for employing
and supporting [Za](http://lighter.io/za) project maintainers,
and for being an epically awesome place to work (and play).


## MIT License

Copyright (c) 2014 Sam Eubank

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## How to Contribute

We welcome contributions from the community and are happy to have them.
Please follow this guide when logging issues or making code changes.

### Logging Issues

All issues should be created using the
[new issue form](https://github.com/lighterio/za/issues/new).
Please describe the issue including steps to reproduce. Also, make sure
to indicate the version that has the issue.

### Changing Code

Code changes are welcome and encouraged! Please follow our process:

1. Fork the repository on GitHub.
2. Fix the issue ensuring that your code follows the
   [style guide](http://lighter.io/style-guide).
3. Add tests for your new code, ensuring that you have 100% code coverage.
   (If necessary, we can help you reach 100% prior to merging.)
   * Run `npm test` to run tests quickly, without testing coverage.
   * Run `npm run cover` to test coverage and generate a report.
   * Run `npm run report` to open the coverage report you generated.
4. [Pull requests](http://help.github.com/send-pull-requests/) should be made
   to the [master branch](https://github.com/lighterio/za/tree/master).

### Contributor Code of Conduct

As contributors and maintainers of Za, we pledge to respect all
people who contribute through reporting issues, posting feature requests,
updating documentation, submitting pull requests or patches, and other
activities.

If any participant in this project has issues or takes exception with a
contribution, they are obligated to provide constructive feedback and never
resort to personal attacks, trolling, public or private harassment, insults, or
other unprofessional conduct.

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, edits, issues, and other contributions
that are not aligned with this Code of Conduct. Project maintainers who do
not follow the Code of Conduct may be removed from the project team.

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by opening an issue or contacting one or more of the project
maintainers.

We promise to extend courtesy and respect to everyone involved in this project
regardless of gender, gender identity, sexual orientation, ability or
disability, ethnicity, religion, age, location, native language, or level of
experience.
