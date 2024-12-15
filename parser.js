function Tok(s) {
  this.s = s;
  this.tt = [];
  this.p = 0;
  while (this.p < s.length) this.tt.push(this.next());
}
Tok.prototype.next = function() {
  if (this.s[this.p] == "'" || this.s[this.p] == '"') return this.get_quoted();
};
Tok.prototype.get_quoted = function() {
  const q = this.s[this.p];
  var s = '';
  var c;
  for (var n = this.p + 1; n < this.s.length; n++) {
    c = this.s[n];
    if (c == q) {
      n++;
      if (this.s[n] != q) {
        var x = { t: '""', p: this.p, s: this.s.substring(this.p, n), v: s };
        this.p = n;
        return x;
      }
    }
    s += c;
  }
}

function tokenize(s) { return new Tok(s).tt; }

module.exports = {
  tokenize: tokenize
};