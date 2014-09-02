/**
 * Rudimentary query string parser.
 */
var parse = module.exports = function (string) {
  var object;
  if (typeof string == 'string') {
    if (string[0] == '{') {
      try {
        object = JSON.parse(string);
      }
      catch (e) {
        this.logger.error(e.stack);
        this.logger.log(buffer);
      }
    }
    else {
      object = {};
      string.split('&').forEach(function (pair) {
        pair = pair.split('=');
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        parse.applyPair(object, key, value);
      });
    }
  }
  return object || {};
};

/**
 * Add a key-value pair to an object, coping with query string syntax.
 */
parse.applyPair = function (object, key, value) {
  var isObjectOrArray = false;
  var subKey = null;
  // TODO: Add support for deep nesting.
  key = key.replace(/\[([^\]]*)\]$/, function (match, inner) {
    isObjectOrArray = true;
    subKey = inner;
    return '';
  });
  if (key) {
    if (isObjectOrArray) {
      object[key] = object[key] || ((subKey && isNaN(subKey)) ? {} : []);
      subKey = subKey || object[key].length;
      object[key][subKey] = value;
    }
    else {
      object[key] = value;
    }
  }
};
