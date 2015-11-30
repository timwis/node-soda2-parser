var should = require('should');
var Parser = require('../../index');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));
}

describe('select test', function() {

  it('multiple fields', function() {
    var ast = Parser.parse('$select=foo, bar')
    ast.columns.length.should.eql(2)
  });

  it('field alias', function() {
    var ast = Parser.parse('$select=foo, bar as baz')
    ast.columns[1].as.should.eql('baz')
  });

  it('functions', function() {
    var ast = Parser.parse('$select=count(sheep) as total_sheep, date_trunc_ym(datetime) as month')
    ast.columns[0].expr.type.should.eql('aggr_func')
    ast.columns[0].expr.name.should.eql('COUNT')
    ast.columns[0].as.should.eql('total_sheep')

    ast.columns[1].expr.name.should.eql('date_trunc_ym')
  });

  it('operators', function() {
    var ast = Parser.parse('$select=location, depth * 3.28 AS depth_feet, end - start AS duration')
    //inspect(ast)
    ast.columns[1].expr.operator.should.eql('*')
    ast.columns[1].expr.left.column.should.eql('depth')
    ast.columns[1].expr.right.value.should.eql(3.28)

    ast.columns[2].expr.operator.should.eql('-')
  });

  /* http://dev.socrata.com/docs/datatypes/text.html
  it('double pipe concatenate', function() {
    var ast = Parser.parse('$select=theft_date, dc_dist || dc_num AS dist_dc')
    inspect(ast)
  })*/

});
