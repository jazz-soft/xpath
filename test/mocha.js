const assert = require('assert');
const parser = require('../parser');

describe('tokenize', function() {
  it(`'quoted with "''"'`, function() {
    var tt = parser.tokenize(`'quoted with "''"'`);
    //console.log(tt);
    assert.equal(tt[0].v, `quoted with "'"`);
  });
  it(`"quoted with '""'"`, function() {
    var tt = parser.tokenize(`"quoted with '""'"`);
    //console.log(tt);
    assert.equal(tt[0].v, `quoted with '"'`);
  });
});
