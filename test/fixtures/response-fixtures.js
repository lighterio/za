'use strict';

var responses = module.exports = {};

responses.shortString = 'aaa';

// Preparation of long string
responses.longString = '';
while (responses.longString.length < 2e3) {
    responses.longString += 'a';
}

responses.shortJson = {
        hello: 'world',
        more: 'field',
        morenum: '23',
        array: [ 1, 3, 4, 5 ],
        inner: {
            fields: 1,
            name: 'hello'
        }
    };

// Preparation of long json body
responses.longJson = {};
var i = 0;
while (i++ < 1e3) {
    var key = 'key' + i;
    responses.longJson[key] = 'value' + i;
}

module.exporst = responses;

