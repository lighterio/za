var assert      = require('assert-plus');
var za          = require('../za');

describe('Server', function () {
    describe('@requestListener', function () {

        var server = za();

        before(function (done) {
            // making server fixture
            server.get('/', function (req, res) {
                res.json({ hello: 'world' });
            });
            done();
        });

        it('should return requestListener', function () {
            var listener = server.requestListener('http');

            assert.func(listener, 'listener');
            assert.ok(listener.length === 2);
        });
    });
});