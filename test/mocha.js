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
  it('comment', function() {
    assert.equal(parser.tokenize('(::)')[0].s, '(::)');
    assert.equal(parser.tokenize('(:(:():):)')[0].s, '(:(:():):)');
    assert.throws(function() { parser.tokenize('(:)'); });
  });
  it('braced URI', function() {
    assert.equal(parser.tokenize('Q{ }x')[0].v, '');
    assert.equal(parser.tokenize('Q{ http:// }x')[0].v, 'http://');
    assert.throws(function() { parser.tokenize('Q{ '); });
  });
  it('name', function() {
    assert.equal(parser.tokenize('AB_YZ')[0].v, 'AB_YZ');
    assert.equal(parser.tokenize('ab8yz')[0].v, 'ab8yz');
    assert.equal(parser.tokenize('español')[0].v, 'español');
    assert.equal(parser.tokenize('中文')[0].v, '中文');
    assert.equal(parser.tokenize('ខ្មែរ')[0].v, 'ខ្មែរ'); // as of 12/24, error in Chrome/Firefox, ok in Edge
  });
  it('qname', function() {
    var x = parser.tokenize('aaa:x');
    assert.equal(x[0].t, 'pref');
    assert.equal(x[1].t, 'name');
    x = parser.tokenize('Q{ qqq }x');
    assert.equal(x[0].t, 'Q{}');
    assert.equal(x[1].t, 'name');
    assert.throws(function() { parser.tokenize('aaa: x'); });
    assert.throws(function() { parser.tokenize('aaa:'); });
    assert.throws(function() { parser.tokenize('Q{ qqq }:x'); });
    assert.throws(function() { parser.tokenize('Q{ qqq } x'); });
  });
  it('axis', function() {
    var x = parser.tokenize('descendant-or-self::x');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'name');
    x = parser.tokenize('child::x:y');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'pref');
    assert.equal(x[2].t, 'name');
    x = parser.tokenize('child::Q{x}y');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'Q{}');
    assert.equal(x[2].t, 'name');
    assert.throws(function() { parser.tokenize('child::'); });
    assert.throws(function() { parser.tokenize('*::'); });
  });
  it('wildcard', function() {
    var x = parser.tokenize('child::x:*');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'pref');
    assert.equal(x[2].t, 'name');
    x = parser.tokenize('child::*:x');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'pref');
    assert.equal(x[2].t, 'name');
    x = parser.tokenize('*');
    assert.equal(x[0].t, 'name');
  });
  it('other', function() {
    assert.equal(parser.tokenize('//')[0].t, '//');
    assert.equal(parser.tokenize('?')[0].t, '?');
  });
});

describe('parse', function() {
  it('empty', function() {
    parser.parse('');
  });
});
