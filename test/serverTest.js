// Import section
var assert      = require('assert-plus');
var za          = require('../za');
var request     = require('supertest');
var qs          = require('qs');
var zlib        = require('zlib');

describe('Server', function () {
    var server;
    var postBody;
    before(function () {
        server = za();
        postBody = {
            hello: 'world',
            more: 'field',
            morenum: '23',
            array: [ 1, 3, 4, 5 ],
            inner: {
                fields: 1,
                name: 'hello'
            }
        };

        // TODO organize fixtures
        server.get('/', function (req, res) {
            res.json({ hello: 'world' });
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

        server.get('/query', function (req, res) {
            var q = req.query;
            q.hello = parseInt(q.hello);
            res.json(q);
        });

        server.post('/file', function (req, res) {
            var busboy = req.files;
            assert.ok(req.files);
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
    });

    it('should throw error for wildcard route', function () {
        // server.get('/some/*', function (req, res) {
        //         res.send('something');
        //     });
        try {
            server.get('/some/*', function (req, res) {
                res.send('something');
            });
        } catch (e) {
            return;
        }
        assert.fail();

    });

    it('should execute middleware', function (done) {
        request(server.requestListener()).get('/middleware')
            .expect(200)
            .expect(JSON.stringify([1,2]), done);
    });


    describe('@requestListener', function () {

        it('should return requestListener', function () {
            var listener = server.requestListener('http');

            assert.func(listener, 'listener');
            assert.ok(listener.length === 2);
        });
    });

    describe('router', function () {
        it('should return 404 response', function (done) {
            request(server.requestListener()).get('/notfound')
                .expect(404)
                .end(done);
        });

        it('should parse query param', function (done) {
            var queryObj = {
                hello: 12,
                world: 'too',
                array: ['some', 'array', 'value', 'oiu']
            };

            var query = qs.stringify(queryObj);
            request(server.requestListener()).get('/query?' + query)
                    .expect(JSON.stringify(queryObj))
                    .end(done);
        });
    });


    describe('body parser', function () {

        it('should parse passed json body', function (done) {
            request(server.requestListener())
                   .post('/json')
                   .set('Content-Type', 'application/json')
                   .send(JSON.stringify(postBody))
                   .end(done);
        });

        it('should parse urlencoded post body', function (done) {

            request(server.requestListener())
                   .post('/urlencoded')
                   .send(JSON.stringify(postBody))
                   .end(done);

        });

        it('should parse multipart/form-data into a stream', function (done) {
            request(server.requestListener())
                    .post('/file')
                    .set('content-type', 'multipart/form-data')
                    .attach('avatar', require('path').join(__dirname, '../za.js'))
                    .expect('za.js')
                    .end(done);
        });
    });
});