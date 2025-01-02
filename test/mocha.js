const assert = require('assert');
const parser = require('../parser');

describe('tokenize', function() {
  it('empty', function() {
    assert.equal(parser.tokenize('').length, 1);
    assert.equal(parser.tokenize(' \t\r\n ').length, 1);
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
    x = parser.tokenize('@attr');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'name');
    x = parser.tokenize('@ns:attr');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, 'pref');
    assert.equal(x[2].t, 'name');
    assert.throws(function() { parser.tokenize('@:attr'); });
  });
  it('var', function() {
    var x = parser.tokenize('$x');
    assert.equal(x[0].t, '$');
    assert.equal(x[1].t, 'name');
    x = parser.tokenize('$ns:x');
    assert.equal(x[0].t, '$');
    assert.equal(x[1].t, 'pref');
    assert.equal(x[2].t, 'name');
    assert.throws(function() { parser.tokenize('$*'); });
    assert.throws(function() { parser.tokenize('$ns:*'); });
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
    assert.throws(function() { parser.parse(''); });
  });
  it('EQName', function() {
    assert.equal(parser.parse('x').length, 1);
    assert.equal(parser.parse('x:y').length, 1);
    assert.equal(parser.parse('Q{x}y').length, 1);
  });
  it('PathExpr', function() {
    var x = parser.parse('/')[0];
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 1);
    x = parser.parse('/a')[0];
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 2);
    x = parser.parse('/a/b')[0];
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 4);
    x = parser.parse('//a')[0];
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 2);
    x = parser.parse('//a/b//c')[0];
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 6);
    x = parser.parse('a/b')[0];
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 3);
    assert.throws(function() { parser.parse('//'); });
    assert.throws(function() { parser.parse('/a/'); });
  });
  it('Expr', function() {
    assert.equal(parser.parse('a, b:c').length, 2);
    assert.throws(function() { parser.parse('a,'); });
    assert.throws(function() { parser.parse('a b'); });
  });
});
