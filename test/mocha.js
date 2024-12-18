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
  });
  it('number', function() {
    assert.equal(parser.tokenize('.55')[0].v, .55);
    assert.equal(parser.tokenize('-55')[0].v, -55);
  });
  it('other', function() {
    assert.equal(parser.tokenize('?')[0].t, '?');
  });
});
