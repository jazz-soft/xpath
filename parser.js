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
  err('Unmatched quote', p);
}
function get_number(s, p) {
  var f = false;
  var n = p;
  if (s[n] == '.') { n++; f = true; }
  if (!isDigit(s[n])) return;
  while (isDigit(s[n])) n++;
  if (s[n] == '.' && !f) {
    n++;
    while (isDigit(s[n])) n++;
  }
  if (s[n] == 'e' || s[n] == 'E') {
    n++;
    if (s[n] == '+' || s[n] == '-') n++;
    if (!isDigit(s[n])) err('Syntax error', p);
    while (isDigit(s[n])) n++;
  }
  s = s.substring(p, n);
  return { t: 'num', p: p, s: s, v: parseFloat(s) };
}
function isDigit(c) { return c >= '0' && c <= '9'; }
function err(msg, p) { throw new Error(msg + ' in position ' + p); }

module.exports = {
  tokenize: tokenize
};