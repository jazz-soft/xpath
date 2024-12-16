function tokenize(s) {
  var tt = [];
  var p, c, x;
  for (p = 0; p < s.length; p++) {
    c = s[p];
    if (c == ' ' || c == '\t' || c == '\r' || c == '\n') continue;
    else if (c == "'" || c == '"') {
      x = get_quoted(s, p);
      p += x.s.length;
      tt.push(x);
    }
    else tt.push({ t: c, p: p, s: c });
  }
  return tt;
}
function get_quoted(s, p) {
  const q = s[p];
  var c, n, x, v = '';
  for (n = p + 1; n < s.length; n++) {
    c = s[n];
    if (c == q) {
      n++;
      if (s[n] != q) {
        x = { t: '""', p: p, s: s.substring(p, n), v: v };
        p = n;
        return x;
      }
    }
    v += c;
  }
}

module.exports = {
  tokenize: tokenize
};