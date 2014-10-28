var za = require('../../za');
var postBody = require('./body-fixtures').jsonBody;
var responses = require('./response-fixtures');

var server = za();

server.get('/', function (req, res) {
  res.json(responses.shortJson);
});

server.get('/wild/*', function (req, res) {
  var wild = req.url.replace(/^\/wild\//, '');
  res.json({wild: wild});
});

server.get('/*/profile', function (req, res) {
  res.json({profile: req.url.split('/')[1]});
});

server.post('/json', function (req, res) {
  res.json(req.body);
});

server.post('/urlencoded', function (req, res) {
  res.json(req.body);
});

server.get('/middleware', function (req, res) {
  res.json(req.middle);
});

server.use('/middleware', function (req, res, next) {
  req.middle = [1];
  next();
});

server.use('/middleware', function (req, res, next) {
  req.middle.push(2);
  next();
});


server.use(/sync/, function (req, res) {
  req.middle = [1];
  return true;
});

server.use(/async/, function (req, res, next) {
  req.middle.push(2);
  next();
});

server.use('/sync', function (req, res) {
  return req.middle.push(3);
});

server.use('/sync/*/ok', function (req, res) {
  return req.middle.push(4);
});

server.get(/sync/, function (req, res) {
  res.json(req.middle);
});


server.get('/query', function (req, res) {
  var q = req.query;
  q.hello = q.hello;
  res.json(q);
});

server.post('/file', function (req, res) {
  var busboy = req.files;
  is.object(req.files);
  var fileInfo;
  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    file.on('data', function(data) {

    });
    file.on('end', function() {
      fileInfo = filename;
    });
  });

  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {

  });

  busboy.on('finish', function() {
    res.send(fileInfo);
  });
});

module.exports = server;
