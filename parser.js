function tokenize(s) {
  var tt = [];
  var p, c, x;
  for (p = 0; p < s.length; p++) {
    c = s[p];
    if (c == ' ' || c == '\t' || c == '\r' || c == '\n') continue;
    x = get_quoted(s, p) || get_number(s, p) || get_quri(s, p) || get_comment(s, p) || get_name(s, p);
    if (x) {
      p += x.s.length;
      tt.push(x);
      continue;
    }
    else tt.push({ t: c, p: p, s: c });
  }
  return tt;
}
function get_quoted(s, p) {
  const q = s[p];
  if (q != '"' && q != "'") return;
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
function get_quri(s, p) {
  if (s[p] != 'Q' || s[p + 1] != '{') return;
  for (var n = p + 2; n < s.length; n++) if (s[n] == '}') return { t: 'Q{}', p: p, s: s.substring(p, n + 1), v: s.substring(p + 2, n).trim() };
  err('Unmatched brace', p + 1);
}
function get_comment(s, p) {
  if (s[p] != '(' || s[p + 1] != ':') return;
  var k = 1;
  for (var n = p + 2; n < s.length; n++) {
    if (s[n] == '(' && s[n + 1] == ':') { n++; k++; }
    else if (s[n] == ':' && s[n + 1] == ')') {
      n++; k--;
      if (!k) return { t: '(:', p: p, s: s.substring(p, n + 1) };
    }
  }
  err('Incomplete comment', p);
}
function get_name(s, p) {
  if (!isNameStart(charcode(s[p]))) return;
  for (var n = p + 1; n < s.length; n++) if (!isNameChar(charcode(s[n]))) break;
  return { t: 'name', p: p, s: s.substring(p, n), v: s.substring(p, n) };
}
function charcode(c) { return c ? c.charCodeAt(0) : -1; }
function isLetter(c) { return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c == 95; }
function isDigit(c) { return c >= '0' && c <= '9'; }
function isNameStart(c) { // https://www.w3.org/TR/REC-xml/#NT-Name
  return isLetter(c) || c >= 0xC0 && c <= 0xD6 || c >= 0xD8 && c <= 0xF6 || c >= 0xF8 && c <= 0x2FF || c >= 0x370 && c <= 0x37D ||
    c >= 0x37F && c <= 0x1FFF || c >= 0x200C && c <= 0x200D || c >= 0x2070 && c <= 0x218F || c >= 0x2C00 && c <= 0x2FEF ||
    c >= 0x3001 && c <= 0xD7FF || c >= 0xF900 && c <= 0xFDCF || c >= 0xFDF0 && c <= 0xFFFD || c >= 0x10000 && c <= 0xEFFFF;
}
function isNameChar(c) { // https://www.w3.org/TR/REC-xml/#NT-Name
  return isNameStart(c) || c == 45 || c == 46 || c >= 48 && c <= 57 || c == 0xb7 || c >= 0x300 && c <= 0x36F || c >= 0x203F && c <= 0x2040;
}
function err(msg, p) { throw new Error(msg + ' in position ' + p); }
const axes = {
  'child': {},
  'descendant': {},
  'attribute': {},
  'self': {},
  'descendant-or-self': {},
  'following-sibling': {},
  'following': {},
  'namespace': {},
  'parent': {},
  'ancestor': { rev: true },
  'preceding-sibling': { rev: true },
  'preceding': { rev: true },
  'ancestor-or-self': { rev: true }
};

module.exports = {
  tokenize: tokenize
};