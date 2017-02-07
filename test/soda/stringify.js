var should = require('should');
var Parser = require('../../index');
var stringify = require('../../stringify');

describe('stringify test', function() {

  it('no offset by default', function() {
    var ast = Parser.parse('$select=foo&$limit=1')
    var sql = stringify.parse(ast)

    sql.should.eql('SELECT foo LIMIT 1')
  });

  it('sets offset as distinct param', function() {
    var ast = Parser.parse('$select=foo&$limit=5&$offset=10')
    var sql = stringify.parse(ast)

    sql.should.eql('SELECT foo LIMIT 5 OFFSET 10')
  });

});
