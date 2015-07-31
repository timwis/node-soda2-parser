var qs = require('querystring'),
  sqlparser = require('node-sqlparser');

// Converts AST to SQL
exports.stringify = sqlparser.stringify;

// Converts SQL to AST
exports.parse = function(params) {
  // If a string was passed, parse the querystring into an object
  if(typeof params === 'string') {
    params = qs.parse(params);
  }

  // Construct SQL string to be parsed
  var sql = 'SELECT ' + (params.$select || '*');
  if(params.$where) sql += ' WHERE ' + params.$where;
  if(params.$group) sql += ' GROUP BY ' + params.$group;
  if(params.$order) sql += ' ORDER BY ' + params.$order;
  if(params.$limit) {
    sql += ' LIMIT ' + params.$limit;
    if(params.$offset) sql += ', ' + params.$offset;
  }

  return sqlparser.parse(sql);
};
