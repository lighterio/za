function isBr(n) {
  return n == 13 || n == 10;
}

function str(n) {
  return String.fromCharCode(n);
}

module.exports = function (request, response, maxBytes) {

  var total = 0;
  var field;
  var boundary;
  var br;
  var br0;
  var brL;
  var skip;
  var data = '';
  var chunk;
  var length;
  var offset;

  request.on('data', function (bytes) {
    chunk = bytes;
    offset = 0;
    length = bytes.length;
    total += length;
    if (total > maxBytes) {
      request.connection.destroy();
      return;
    }
    if (field) {
      readData();
    }
    else {
      getBoundary();
    }
  });

  function sub(start, length) {
    return '' + chunk.slice(start, start + length);
  }

  function slice(start, end) {
    return '' + chunk.slice(start, end);
  }

  function getBoundary() {
    var i, j, n;
    for (i = 2; i < length; i++) {
      n = chunk[i];
      if (isBr(n)) {
        br0 = n;
        br = str(n);
        n = chunk[i + 1];
        if (isBr(n)) {
          br += str(n);
        }
        brL = br.length;
        break;
      }
    }
    boundary = sub(0, i);
    skip = boundary.replace(/[^-].*$/, '').length - 1;
    offset = i + brL + 1;
    getField();
  }

  function getField() {
    var i;
    for (i = offset; i < length; i++) {
      if ((chunk[i] == br0) && (chunk[i + brL] == br0)) {
        setField(slice(offset - 1, i));
        break;
      }
    }
    offset = i + brL * 2;
    readData();
  }

  function setField(text) {
    field = {size: 0};
    data = '';
    text.split(br).forEach(function (line) {
      line.split(';').forEach(function (pair) {
        pair = pair.replace(/(^\s+|\s+$)/g, '').split(/\s*=\s*/g);
        var k = pair[0];
        var v = pair[1];
        if (v) {
          field[k] = v.replace(/^(['"])(.*)\1$/, '$2');
        }
        else {
          k.replace(/content-type:\s*(.*)/i, function (m, t) {
            field.type = t;
          });
        }
      });
    });
    if (field.filename) {
      request.emit('za:file', field);
    }
  }

  function readData() {
    var i, j, n, d, bL = boundary.length;
    for (i = offset; i < length; i += skip) {
      n = chunk[i];
      if (n == 45) {
        for (j = i; n == 45; j--) {
          n = chunk[j - 1];
        }
        var string = sub(j + 1, bL);
        if (string == boundary) {
          d = chunk.slice(offset, j - brL + 1);
          writeData(d, true);
          field = null;
          offset = j + 1 + bL + brL;
          d = sub(offset - 2, 2);
          if (d == '--') {
            request.emit('za:finished');
          }
          else {
            getField();
          }
          return;
        }
      }
    }
    d = chunk.slice(offset, length);
    writeData(d);
  }

  function writeData(d, end) {
    if (field.filename) {
      if (field.stream) {
        var drained = field.stream.write(d);
        field.size += d.length;
        if (end) {
          if (drained) {
            field.stream.close();
          }
          else {
            field.stream.on('drain', field.stream.close);
          }
        }
      }
    }
    else {
      data += d;
      request.multipart[field.name] = data;
    }
  }

};
