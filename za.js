// Decorate http objects.
require('./lib/decorations/http');

// Allow us to instantiate HTTP and HTTPS servers.
var Server = require('./lib/prototypes/Server');

var api = module.exports = function () {
    return new Server();

};

/**
 * Expose the version to module users.
 */
api.version = require('./package.json').version;
