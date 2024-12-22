const assert = require('assert');
const parser = require('../parser');

describe('tokenize', function() {
  it('empty', function() {
    assert.equal(parser.tokenize('').length, 0);
    assert.equal(parser.tokenize(' \t\r\n ').length, 0);
  });
  it('quoted', function() {
    assert.equal(parser.tokenize(`'quoted with "''"'`)[0].v, `quoted with "'"`);
    assert.equal(parser.tokenize(`"quoted with '""'"`)[0].v, `quoted with '"'`);
    assert.throws(function() { parser.tokenize('"...'); });
  });
  it('number', function() {
    assert.equal(parser.tokenize('.55')[0].v, .55);
    assert.equal(parser.tokenize('-55')[1].v, 55);
    assert.equal(parser.tokenize('3.14')[0].v, 3.14);
    assert.equal(parser.tokenize('1.e4')[0].v, 1.e4);
    assert.equal(parser.tokenize('1E-10')[0].v, 1E-10);
    assert.throws(function() { parser.tokenize('1e-'); });
  });
  it('braced URI', function() {
    assert.equal(parser.tokenize('Q{ }')[0].v, '');
    assert.equal(parser.tokenize('Q{ http:// }')[0].v, 'http://');
    assert.throws(function() { parser.tokenize('Q{ '); });
  });
  it('other', function() {
    assert.equal(parser.tokenize('?')[0].t, '?');
  });
});
