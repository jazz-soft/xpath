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
    else if (x = get_number(s, p)) {
      p += x.s.length;
      tt.push(x);
    }
    else tt.push({ t: c, p: p, s: c });
  }
  return tt;
}
function get_quoted(s, p) {
  const q = s[p];
  var c, n, v = '';
  for (n = p + 1; n < s.length; n++) {
    c = s[n];
    if (c == q) {
      n++;
      if (s[n] != q) return { t: '""', p: p, s: s.substring(p, n), v: v };
    }
    v += c;
  }
}
function get_number(s, p) {
  var t = 0;
  var n = p + 1;
  if (s[p] == '.' && isDigit(s[n])) { t = 1; n++; }
  else if (s[p] == '-' && isDigit(s[n])) n++;
  else if (!isDigit(s[p])) return;
  while (isDigit(s[n])) n++;
  s = s.substring(p, n);
  return { t: 'num', p: p, s: s, v: parseFloat(s) };
}
function isDigit(c) { return c >= '0' && c <= '9'; }

module.exports = {
  tokenize: tokenize
};