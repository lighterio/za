// Generic body parser middleware interface
// Todo: parser related object can be either middleware or separate npm module
(function (module) {
    'use strict';
    // Import section
    var qs = require('qs');
    var Busboy = require('busboy');
    var rawParser = require('./raw-bodyparser');

    // TODO separate different parsers into different file..
    // think of some good way to structure them
    // JSON Parsing
    function jsonParser (req, res, opt, next) {
        read(req, res, opt, next, JSON.parse);
    }

    // urlencoded form data parsing
    function urlEncodedParser (req, res, opt, next) {
        read(req, res, opt, next, qs.parse);
    }

    // file body parser using busboy
    function fileParser (req, res, opt, next) {
        opt = opt || {};
        console.log('fileparser');
        var busboy = new Busboy({
            headers: req.headers,
            highWaterMark: opt.highWaterMark || 1e6,
            limits: {
                fileSize: opt.fileSize || 1e7   // limit to ~10MB
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
    function read(req, res, opt, next, parse) {
      var length = req.headers['content-length'];
      var waitend = true;
      opt = opt || {};

      var options = {
        encoding: opt.encoding || 'utf-8',
        limit: opt.limit || 1e7,      // limit to ~10 MB
        length: length
      };

      req.on('aborted', cleanup);
      req.on('end', cleanup);
      req.on('error', cleanup);

      rawParser(req, options, function (err, body) {
        if (err && waitend && req.readable) {
          req.resume();
          req.once('end', function onEnd() {
            next(err);
          });
          return;
        }

        if (err) {
          return next(err);
        }
        var str;
        try {
          str = typeof body !== 'string' ?
                  body.toString(options.encoding) :
                  body;
          req.body = parse(str);
        } catch (error) {
          error.body = str;
          error.status = 400;
          return next(error);
        }

        next();
      });

      function cleanup() {
        waitend = false;
        req.removeListener('aborted', cleanup);
        req.removeListener('end', cleanup);
        req.removeListener('error', cleanup);
      }

    }

    function Parser(opt) {
      console.log('parser ready');
        this.options = opt;
    }

    Parser.prototype.parsers = function (type) {
        var opt = this.options;

        var parsers = {
            'application/json': function (req, res, next) {
                jsonParser.call(null, req, res, opt, next);
            },
            'application/x-www-form-urlencoded': function (req, res, next) {
                urlEncodedParser.call(null, req, res, opt, next);
            },
            'multipart/form-data': function (req, res, next) {
                fileParser.call(null, req, res, opt, next);
            }
        };
        var chosen = parsers[type] || parsers['application/x-www-form-urlencoded'];     // default parsers
        return chosen;
    };

    Parser.prototype.serve = function (req, res, next) {
        var type = req.headers['content-type'];
        type = type.split(';')[0];
        this.parsers(type).call(this, req, res, next);
    };

    var parser = new Parser({
        encoding: 'utf-8',
        limit: 1e7,      // limit to ~10 MB
    });

    module.exports = function (req, res, next) {
        parser.serve.call(parser, req, res, next);
    };
})(module);
