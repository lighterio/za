var qs = require('qs');
var bodies = module.exports = {};

bodies.jsonBody = {
        hello: 'world',
        more: 'field',
        morenum: '23',
        array: [ 1, 3, 4, 5 ],
        inner: {
            fields: 1,
            name: 'hello'
        }
    };

bodies.formBody = qs.stringify(bodies.jsonBody);
