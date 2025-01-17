const assert = require('assert');
const parser = require('../parser');
const XPath = require('..');

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
    var x = XPath.parse('');
    assert.equal(x.type, 'Empty');
    x = XPath.parse(' ');
    assert.equal(x.type, 'Empty');
  });
  it('PrimaryExpr', function() {
    var x = XPath.parse('.');
    assert.equal(x.type, '.');
    x = XPath.parse('1');
    assert.equal(x.type, 'Numeric');
    x = XPath.parse('"quoted"');
    assert.equal(x.type, 'String');
    x = XPath.parse('$var');
    assert.equal(x.type, 'VarRef');
    x = XPath.parse('$ns:var');
    assert.equal(x.type, 'VarRef');
    x = XPath.parse('()');
    assert.equal(x.type, 'Empty');
    x = XPath.parse('(1)');
    assert.equal(x.type, 'Numeric');
    x = XPath.parse('(1,2)');
    assert.equal(x.type, 'Seq');
    x = XPath.parse('call()');
    assert.equal(x.type, 'FunctionCall');
    assert.equal(x.a[1].type, 'ArgumentList');
    assert.equal(x.a[1].a.length, 0);
    x = XPath.parse('call(1)');
    assert.equal(x.type, 'FunctionCall');
    assert.equal(x.a[1].type, 'ArgumentList');
    assert.equal(x.a[1].a.length, 1);
    x = XPath.parse('call(?, 1)');
    assert.equal(x.type, 'FunctionCall');
    assert.equal(x.a[1].type, 'ArgumentList');
    assert.equal(x.a[1].a.length, 2);
    assert.throws(function() { XPath.parse('call('); });
    assert.throws(function() { XPath.parse('call(1 2)'); });
  });
  it('PostfixExpr', function() {
    var x = XPath.parse('$x[1]');
    x = XPath.parse('x()(?)');
    assert.throws(function() { XPath.parse('$x[]'); });
    //console.log(x);
  });
  it('EQName', function() {
    var x = XPath.parse('x');
    assert.equal(x.type, 'AxisStep');
    assert.equal(x.a[0].type, 'Axis');
    assert.equal(x.a[1].type, 'NameTest');
    x = XPath.parse('x:y');
    assert.equal(x.type, 'AxisStep');
    assert.equal(x.a[0].type, 'Axis');
    assert.equal(x.a[1].type, 'NameTest');
    x = XPath.parse('Q{x}y');
    assert.equal(x.type, 'AxisStep');
    assert.equal(x.a[0].type, 'Axis');
    assert.equal(x.a[1].type, 'NameTest');
  });
  it('PathExpr', function() {
    var x = XPath.parse('/');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 1);
    x = XPath.parse('/a');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 2);
    x = XPath.parse('/a/b');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 4);
    x = XPath.parse('//a');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 2);
    x = XPath.parse('//a/b//c');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 6);
    x = XPath.parse('a/b');
    assert.equal(x.type, 'PathExpr');
    assert.equal(x.a.length, 3);
    x = XPath.parse('/node()[1]/../preceding::*[1]/*:x/x:*/Q{}*/@att');
    //console.log(x);
    assert.throws(function() { XPath.parse('//'); });
    assert.throws(function() { XPath.parse('/a/'); });
    assert.throws(function() { XPath.parse('/*:*'); });
  });
  it('Expr', function() {
    var x = XPath.parse('1, 2, 3');
    assert.equal(x.type, 'Seq');
    x = XPath.parse('"a", "b"');
    assert.equal(x.type, 'Seq');
    assert.throws(function() { XPath.parse('a,'); });
    assert.throws(function() { XPath.parse('a b'); });
  });
  it('SimpleMapExpr', function() {
    var x = XPath.parse('a!b');
    assert.equal(x.type, 'SimpleMapExpr');
    assert.throws(function() { XPath.parse('a!'); });
  });
  it('Unary', function() {
    var x = XPath.parse('-+-+-1');
    assert.equal(x.type, 'Unary');
    x = XPath.parse('--1');
    assert.equal(x.type, 'Numeric');
    assert.throws(function() { XPath.parse('+'); });
  });
  it('ArrowExpr', function() {
    var x = XPath.parse('a => b()');
    assert.equal(x.type, 'ArrowExpr');
    assert.throws(function() { XPath.parse('a=>'); });
    assert.throws(function() { XPath.parse('a=>b'); });
  });
  it('CastExpr', function() {
    var x = XPath.parse('a cast as b');
    assert.equal(x.type, 'CastExpr');
    x = XPath.parse('a cast as b?');
    assert.equal(x.type, 'CastExpr');
    assert.throws(function() { XPath.parse('a cast as'); });
  });
  it('CastableExpr', function() {
    var x = XPath.parse('a castable as b');
    assert.equal(x.type, 'CastableExpr');
    assert.throws(function() { XPath.parse('a castable as'); });
  });
  it('IntersectExceptExpr', function() {
    var x = XPath.parse('a intersect b except c');
    assert.equal(x.type, 'IntersectExceptExpr');
    assert.throws(function() { XPath.parse('a intersect'); });
    assert.throws(function() { XPath.parse('a except'); });
  });
  it('UnionExpr', function() {
    var x = XPath.parse('a | b');
    assert.equal(x.type, 'UnionExpr');
    x = XPath.parse('a union b');
    assert.equal(x.type, 'UnionExpr');
    assert.throws(function() { XPath.parse('a|'); });
    assert.throws(function() { XPath.parse('a union'); });
  });
  it('MultiplicativeExpr', function() {
    var x = XPath.parse('a * b');
    assert.equal(x.type, 'MultiplicativeExpr');
    x = XPath.parse('a div b mod c');
    assert.equal(x.type, 'MultiplicativeExpr');
    assert.throws(function() { XPath.parse('a*'); });
    assert.throws(function() { XPath.parse('a idiv'); });
  });
  it('AdditiveExpr', function() {
    var x = XPath.parse('a + b - c');
    assert.equal(x.type, 'AdditiveExpr');
    assert.throws(function() { XPath.parse('a+'); });
    assert.throws(function() { XPath.parse('a -'); });
  });
  it('RangeExpr', function() {
    var x = XPath.parse('1 to 10');
    assert.equal(x.type, 'RangeExpr');
    assert.throws(function() { XPath.parse('1 to'); });
  });
  it('StringConcatExpr', function() {
    var x = XPath.parse('a || b||c');
    assert.equal(x.type, 'StringConcatExpr');
    assert.throws(function() { XPath.parse('a||'); });
  });
  it('ComparisonExpr', function() {
    var x = XPath.parse('a = b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a != b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a < b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a > b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a <= b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a >= b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a << b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a >> b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a eq b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a ne b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a lt b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a gt b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a le b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a ge b');
    assert.equal(x.type, 'ComparisonExpr');
    x = XPath.parse('a is b');
    assert.equal(x.type, 'ComparisonExpr');
    assert.throws(function() { XPath.parse('a!='); });
    assert.throws(function() { XPath.parse('a eq'); });
  });
  it('AndExpr', function() {
    var x = XPath.parse('a and b and c');
    assert.equal(x.type, 'AndExpr');
    assert.throws(function() { XPath.parse('a and'); });
  });
  it('OrExpr', function() {
    var x = XPath.parse('a or b or c');
    assert.equal(x.type, 'OrExpr');
    assert.throws(function() { XPath.parse('a or'); });
  });
});

describe('evaluate', function() {
  it('unknown', function() {
    var xp = new XPath('');
    xp.T = { type: 'Unknown' };
    assert.throws(function() { xp.evaluate(); });
  });
  it('empty', function() {
    var x = XPath.evaluate('');
    assert.equal(x.length, 0);
  });
  it('literal', function() {
    assert.equal(XPath.evaluate('"string"')[0], 'string');
    assert.equal(XPath.evaluate('20')[0], 20);
    assert.equal(XPath.evaluate('0.2')[0], 0.2);
    assert.equal(XPath.evaluate('1.e-5')[0], 1.e-5);
  });
});
