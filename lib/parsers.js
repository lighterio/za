// Generic body parser middleware interface
// Todo: parser related object can be either middleware or separate npm module
(function (module) {
    'use strict';
    // Import section
    var qs = require('qs');
    var Busboy = require('busboy');

    // TODO separate different parsers into different file..
    // think of some good way to structure them
    // JSON Parsing
    function jsonParser (req, res, next) {
        read(req, res, next, JSON.parse);
    }

    // urlencoded form data parsing
    function urlEncodedParser (req, res, next) {
        read(req, res, next, qs.parse);
    }

    // file body parser using busboy
    function fileParser (req, res, next) {
        var busboy = new Busboy({
            headers: req.headers,
            highWaterMark: 1e6,
            limits: {
                fileSize: 1e7   // limit to ~10MB
            }
        });

        // setting busboy interface to req.files

        req.files = busboy;
        req.pipe(busboy);
        next();
    }

    // Commong body reader other parser that parses from a bod string
    // Heavily influenced from express body-parser
    // @see body-parser
    function read(req, res, next, parse) {

      var body = '';
      req.on('error', function onError(err) {
        next(err);
      });

      req.on('end', function onEnd () {
        req.body = parse(body);
        next();
      });

      req.on('data', function onData (data) {
        body += data;
        if (body.length > 1e6) {
          req.connection.destroy();
        }
      });
    }

    // TODO add more content-type to support it
    var parsers = {
        'application/json': jsonParser,
        'application/x-www-form-urlencoded': urlEncodedParser,
        'multipart/form-data': fileParser,
        default: urlEncodedParser
    };

    function serve (req, res, next) {
        var type = req.headers['content-type'];
        type = type.split(';')[0];
        var parser = parsers[type] || parsers.default;
        parser.call(null, req, res, next);
    }

    module.exports = function (req, res, next) {
        serve.call(null, req, res, next);
    };
})(module);
