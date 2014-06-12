'use strict';
// Import section
var StringDecoder = require('string_decoder').StringDecoder;

// Heavily inflenced by raw-body npm module
// @see raw-body
module.exports = function rawbodyParser (stream, options, next) {

  var length = parseInt(options.length, 10);
  var limit = parseInt(options.length, 10);

  if (limit < length) {
    if (typeof stream.pause === 'function') {
      stream.pause();
    }

    process.nextTick(function () {
      var err = makeError({
                  message: 'request entity is too large',
                  type: 'entity.too.large',
                  status: 413,
                  length: length,
                  limit: limit
                });
      next(err);
    });
  }

  // streams1: assert request encoding is buffer.
  // streams2+: assert the stream encoding is buffer.
  //   stream._decoder: streams1
  //   state.encoding: streams2
  //   state.decoder: streams2, specifically < 0.10.6
  var state = stream._readableState;
  if (stream._decoder || (state && (state.encoding || state.decoder))) {
    process.nextTick(function () {
      // developer error
      var err = makeError({
                  message: 'stream encoding should not be set',
                  type: 'stream.encoding.set',
                  status: 500
                });
      next(err);
    });
  }

  var received = 0;
  var decoder = new StringDecoder(options.encoding);
  var buffer = decoder ? '' : [];

  stream.on('data', onData);
  stream.once('end', onEnd);
  stream.once('error', onEnd);
  stream.once('close', cleanup);

  function onData(data) {
    received += data.length;
    decoder ? buffer += decoder.write(data)
            : buffer.push(data);

    if (received > limit) {
      if (typeof stream.pause === 'function') {
        stream.pause();
      }

      var err = makeError({
                  message: 'request entity is too large',
                  type: 'entity.too.large',
                  status: 413,
                  received: received,
                  limit: limit,
                  length: length
                });
      next(err);
      cleanup();
    }
  }

  function onEnd(err) {
    if (err) {
      if (typeof stream.pause === 'function') {
        stream.pause();
        next(err);
      }
    } else if (length !== received) {
      err = makeError({
              message: 'request entity did not match content lenght',
              type: 'request.size.invalid',
              stats: 400,
              received: received,
              length: length,
              limit: limit}
            );
      next(err);
    } else {
      next(null, decoder ? buffer + decoder.end() : Buffer.concat(buffer));
    }

    cleanup();
  }

  function makeError(opt) {
    var err = new Error();
    err.message = opt.message;
    Object.defineProperty(err, 'type', {
      enumerable: true,
      writable: true,
      configurable: true,
      value: opt.type
    });

    err.status = err.statusCode = opt.status;
    err.received = opt.received;
    err.length = err.expected = opt.length;
    err.limit = opt.limit;

    return err;
  }

  function cleanup() {
    received = buffer = null;
    stream.removeListener('data', onData);
    stream.removeListener('end', onEnd);
    stream.removeListener('error', onEnd);
    stream.removeListener('close', cleanup);
  }
};