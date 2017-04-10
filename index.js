var qs = require('querystring'),
  sqlparser = require('node-sqlparser');

var excludeFields = ['accessType', 'bom'];

// Converts AST to SQL
exports.stringify = require('./stringify');

// Converts SQL to AST
exports.parse = function(params) {
  // If a string was passed, parse the querystring into an object
  if(typeof params === 'string') {
    params = qs.parse(params);
  }

  // Append simple filters to WHERE clause
  var where = [];
  if(params.$where) where.push(params.$where);
  for(key in params) {
    if(key.charAt(0) !== '$' && excludeFields.indexOf(key) === -1) {
      where.push(whereEqual(key, params[key]));
    }
  }
  params.$where = where.join(' AND ');

  // Construct SQL string to be parsed
  var sql = 'SELECT ' + (params.$select || '*');
  if(params.$where) sql += ' WHERE ' + params.$where;
  if(params.$group) sql += ' GROUP BY ' + params.$group;
  if(params.$order) sql += ' ORDER BY ' + params.$order;
  if(params.$limit) {
    sql += ' LIMIT ';
    if(params.$offset) sql += params.$offset + ', ';
    sql += params.$limit;
  }

  return sqlparser.parse(sql);
};

function whereEqual (key, value) {
  var sanitizedValue = value.replace(/^['"]|['"]$/g, '') // remove surrounding quotes
                            .replace(/\'/g, "\\'") // escape inner quotes
  return key + " = '" + sanitizedValue + "'";
}
