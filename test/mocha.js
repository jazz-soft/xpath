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
    assert.equal(x[2].t, '*');
    x = parser.tokenize('child::*:x');
    assert.equal(x[0].t, 'axis');
    assert.equal(x[1].t, '*:');
    assert.equal(x[2].t, 'name');
    x = parser.tokenize('*');
    assert.equal(x[0].t, '*');
  });
  it('other', function() {
    assert.equal(parser.tokenize('//')[0].t, '//');
    assert.equal(parser.tokenize('?')[0].t, '?');
  });
});

describe('parse', function() {
  it('empty', function() {
    var x = parser.parse('');
    assert.equal(x.type, 'Empty');
    x = parser.parse(' ');
    assert.equal(x.type, 'Empty');
  });
  it('PrimaryExpr', function() {
    var x = parser.parse('.');
    assert.equal(x.type, '.');
    x = parser.parse('1');
    assert.equal(x.type, 'Numeric');
    x = parser.parse('"quoted"');
    assert.equal(x.type, 'String');
    x = parser.parse('$var');
    assert.equal(x.type, 'VarRef');
    x = parser.parse('$ns:var');
    assert.equal(x.type, 'VarRef');
    x = parser.parse('()');
    assert.equal(x.type, 'Empty');
    x = parser.parse('(1)');
    assert.equal(x.type, 'Numeric');
    x = parser.parse('(1,2)');
    assert.equal(x.type, 'Seq');
    x = parser.parse('call()');
    assert.equal(x.type, 'FunctionCall');
    assert.equal(x.a[1].type, 'ArgumentList');
    assert.equal(x.a[1].a.length, 0);
    x = parser.parse('call(1)');
    assert.equal(x.type, 'FunctionCall');
    assert.equal(x.a[1].type, 'ArgumentList');
    assert.equal(x.a[1].a.length, 1);
    x = parser.parse('call(?, 1)');
    assert.equal(x.type, 'FunctionCall');
    assert.equal(x.a[1].type, 'ArgumentList');
    assert.equal(x.a[1].a.length, 2);
    assert.throws(function() { parser.parse('call('); });
    assert.throws(function() { parser.parse('call(1 2)'); });
  });
  it('PostfixExpr', function() {
    var x = parser.parse('$x[1]');
    x = parser.parse('x()(?)');
    assert.throws(function() { parser.parse('$x[]'); });
    //console.log(x);
  });
  it('EQName', function() {
    var x = parser.parse('x');
    assert.equal(x.type, 'AxisStep');
    assert.equal(x.a[0].type, 'Axis');
    assert.equal(x.a[1].type, 'NameTest');
    x = parser.parse('x:y');
    assert.equal(x.type, 'AxisStep');
    assert.equal(x.a[0].type, 'Axis');
    assert.equal(x.a[1].type, 'NameTest');
    x = parser.parse('Q{x}y');
    assert.equal(x.type, 'AxisStep');
    assert.equal(x.a[0].type, 'Axis');
    assert.equal(x.a[1].type, 'NameTest');
  });
  it('PathExpr', function() {
    var x = parser.parse('/');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 1);
    x = parser.parse('/a');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 2);
    x = parser.parse('/a/b');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 4);
    x = parser.parse('//a');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 2);
    x = parser.parse('//a/b//c');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 6);
    x = parser.parse('a/b');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 3);
    x = parser.parse('/node()[1]/../preceding::*[1]/*:x/x:*/Q{}*/@att');
    //console.log(x);
    assert.throws(function() { parser.parse('//'); });
    assert.throws(function() { parser.parse('/a/'); });
    assert.throws(function() { parser.parse('/*:*'); });
  });
  it('Expr', function() {
    var x = parser.parse('1, 2, 3');
    assert.equal(x.type, 'Seq');
    x = parser.parse('"a", "b"');
    assert.equal(x.type, 'Seq');
    assert.throws(function() { parser.parse('a,'); });
    assert.throws(function() { parser.parse('a b'); });
  });
  it('SimpleMapExpr', function() {
    var x = parser.parse('a!b');
    assert.equal(x.type, 'SimpleMapExpr');
    assert.throws(function() { parser.parse('a!'); });
  });
  it('Unary-', function() {
    var x = parser.parse('-+-+-1');
    assert.equal(x.type, 'Unary-');
    x = parser.parse('--1');
    assert.equal(x.type, 'Numeric');
    assert.throws(function() { parser.parse('+'); });
  });
  it('ArrowExpr', function() {
    var x = parser.parse('a => b()');
    assert.equal(x.type, 'ArrowExpr');
    assert.throws(function() { parser.parse('a=>'); });
    assert.throws(function() { parser.parse('a=>b'); });
  });
  it('CastExpr', function() {
    var x = parser.parse('a cast as b');
    assert.equal(x.type, 'CastExpr');
    x = parser.parse('a cast as b?');
    assert.equal(x.type, 'CastExpr');
    assert.throws(function() { parser.parse('a cast as'); });
  });
  it('CastableExpr', function() {
    var x = parser.parse('a castable as b');
    assert.equal(x.type, 'CastableExpr');
    assert.throws(function() { parser.parse('a castable as'); });
  });
  it('IntersectExceptExpr', function() {
    var x = parser.parse('a intersect b except c');
    assert.equal(x.type, 'IntersectExceptExpr');
    assert.throws(function() { parser.parse('a intersect'); });
    assert.throws(function() { parser.parse('a except'); });
  });
  it('UnionExpr', function() {
    var x = parser.parse('a | b');
    assert.equal(x.type, 'UnionExpr');
    x = parser.parse('a union b');
    assert.equal(x.type, 'UnionExpr');
    assert.throws(function() { parser.parse('a|'); });
    assert.throws(function() { parser.parse('a union'); });
  });
  it('MultiplicativeExpr', function() {
    var x = parser.parse('a * b');
    assert.equal(x.type, 'MultiplicativeExpr');
    x = parser.parse('a div b mod c');
    assert.equal(x.type, 'MultiplicativeExpr');
    assert.throws(function() { parser.parse('a*'); });
    assert.throws(function() { parser.parse('a idiv'); });
  });
  it('AdditiveExpr', function() {
    var x = parser.parse('a + b - c');
    assert.equal(x.type, 'AdditiveExpr');
    assert.throws(function() { parser.parse('a+'); });
    assert.throws(function() { parser.parse('a -'); });
  });
  it('RangeExpr', function() {
    var x = parser.parse('1 to 10');
    assert.equal(x.type, 'RangeExpr');
    assert.throws(function() { parser.parse('1 to'); });
  });
});
