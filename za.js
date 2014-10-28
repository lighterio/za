// Decorate Request and Response prototypes.
require('./lib/Request');
require('./lib/Response');

// Allow us to instantiate HTTP and HTTPS servers.
var Server = require('./lib/Server');

// The API is a function which returns a server.
var za = module.exports = function () {
  return new Server();
};

// Expose the version number, but only load package JSON if a get is performed.
Object.defineProperty(za, 'version', {
  get: function () {
    return require('./package.json').version;
  }
});
