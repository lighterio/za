// Decorate http objects.
require('./lib/http');

// Allow us to instantiate HTTP and HTTPS servers.
var Server = require('./lib/Server');

var api = module.exports = function () {
    return new Server();

};

/**
 * Expose the version to module users.
 */
api.version = require('./package.json').version;
