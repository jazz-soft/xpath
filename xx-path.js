const parser = require('./parser');

function XPath(s) {
  this.T = parser.parse(s);
}
XPath.prototype.evaluate = function(obj) {
  //console.log(this.T);
  return eval(this.T, obj);
}
XPath.evaluate = function(x, obj) {
  if (typeof x == 'string') x = new XPath(x);
  return x.evaluate(obj);
}
XPath.parse = parser.parse;

function eval(T, w) {
  if (!eval[T.type]) throw 'Not yet implemented: ' + T.type;
  return eval[T.type](T, w);
}
eval.Empty = function() { return []; }
eval.String = function(T) { return [T.v]; }
eval.Numeric = function(T) { return [T.v]; }

module.exports = XPath;
