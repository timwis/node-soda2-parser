
var escapeMap = {
  '\0'  : '\\0',
  // '\''  : '\\\'',
  '\"'   : '\\\"',
  '\b'  : '\\b',
  '\n'  : '\\n',
  '\r'  : '\\r',
  '\t'  : '\\t',
  '\x1a': '\\Z',        /**<    EOF */
  '\\'  : '\\\\',
  "\'"  : "''"
//  '%'   : '\\%',
//  '_'  :  '\_'
};

function escape(str) {
  var res = [];
  var c, e;
  for (var i = 0 ;i < str.length; i++) {
    c = str[i];
    e = escapeMap[c];
    if (e) {
      c = e;
    }
    res.push(c);
  }
  return res.join('');
}

function literalToSQL(l) {
  var t = l.type;
  var v = l.value;
  // if t === number, do nothing
  if (t === 'string') {
    v = '\'' + escape(v) + '\'';
    //v = '"' + v + '"';
  } else if (t === 'bool') {
    v = v ? 'TRUE' : 'FALSE';
  } else if (t === 'null') {
    v = 'NULL';
  } else if (t === 'star') {
    v = '*';
  }

  if (l.paren) {
    return '(' + v + ')';
  } else {
    return v;
  }
}

function unaryToSQL(e) {
  var str = e.operator + ' ' + exprToSQL(e.expr);
  if (e.paren) {
    return '(' + str  + ')';
  } else {
    return str;
  }
}

function getExprListSQL(l) {
  var es = [];
  for (var i = 0; i < l.length; i++) {
    es.push(exprToSQL(l[i]));
  }
  return es;
}

function binaryToSQL(e) {
  var op    = e.operator;
  var left  = e.left;
  var right = e.right;

  var lstr = exprToSQL(left);
  var rstr = exprToSQL(right);
  if (Array.isArray(rstr)) {
    if (op === '=') {
      op = 'IN';
    }
    if (op === 'BETWEEN') {
      rstr = rstr[0]  + ' AND ' + rstr[1];
    } else {
      rstr = '(' + rstr.join(', ') + ')';
    }
  }

  var str = lstr + ' ' + op + ' ' + rstr;
  if (e.paren) {
    return '(' + str + ')';
  } else {
    return str;
  }
}

function aggrToSQL(e) {
  var args = e.args;
  var str = exprToSQL(args.expr);
  var name = e.name;
  if (name === 'COUNT') {
    //inspect(args);
    var distinct = args.distinct;
    if (distinct) {
      str = 'DISTINCT ' + str;
    }
  }
  //inspect(args);
  return name + '(' + str + ')';
}

function funcToSQL(e) {
  //var es  = getExprListSQL(e.args.value);
  var es  = exprToSQL(e.args);
  var str = e.name + '(' + es.join(', ') + ')';

  if (e.paren) {
    return  '(' + str + ')';
  } else {
    return str;
  }
}

function columnRefToSQL(e) {
  var str = e.column;
  if (e.table) {
    str = e.table + '.' + str;
  }

  if (e.paren) {
    return '(' + str + ')';
  } else {
    return str;
  }
}

exports.exprToSQL = exprToSQL;

function exprToSQL(e) {
  var t = e.type;
  var res ;
  switch (t) {
    case 'unary_expr'   :
      res = unaryToSQL(e);
      break;
    case 'binary_expr'  :
      res = binaryToSQL(e);
      break;
    case 'aggr_func'    :
      res = aggrToSQL(e);
      break;
    case 'function'    :
      res = funcToSQL(e);
      break;
    case 'column_ref' :
      res = columnRefToSQL(e);
      break;
    case 'expr_list' :
      res = getExprListSQL(e.value);
      break;
    case 'var' :
      // res = varToSQL(e);
      throw new Error('unsupported type `var`');
    case 'param':
      res = paramToSql(e);
      break;
    default:
      res = literalToSQL(e);
  }
  return res;
}

function paramToSql(e) {
  return e.value === '?' ? '?' : ':' + e.value;
}

/**
 * Public Methods
 */

exports.distinct = function(distinct, options) {
  return distinct;
}

exports.columns = function(columns, options) {
  var clauses = [];
  if (columns === '*') {
    clauses.push('*');
  } else {
    var cs = [];
    for (var i = 0; i < columns.length; i++) {
      var ea = columns[i];
      var str = exprToSQL(ea.expr);
      if (ea.as) {
        str += (' AS ' + ea.as);
      }
      cs.push(str);
    }
    clauses.push(cs.join(', '));
  }
  return clauses.join(' ');
}

exports.from = function(from, options) {
  options = options || {};
  var clauses = [];
  if (Array.isArray(from)) {
    var tbase = from[0];
    var cs = [];
    var str = tbase.table;
    if (options.keep_db !== false && tbase.db) {
      str = tbase.db + '.' + str;
    }
    if (tbase.as) {
      str += ' AS ' + tbase.as;
    }
    cs.push(str);
    for (var i = 1; i < from.length; i++) {
      var  tref = from[i];
      if (tref.join) {
         str = ' ' + tref.join + ' ';
      } else {
         str = ', ';
      }
      if (options.keep_db !== false && tref.db) {
        str += (tref.db + '.');
      }
      str += tref.table;

      if (tref.as) {
        str += ' AS ' + tref.as;
      }

      if (tref.on) {
         str += ' ON ' + exprToSQL(tref.on);
      }
      cs.push(str);
    }
    clauses.push(cs.join(''));
  }
  return clauses.join(' ');
}

exports.where = function(where, options) {
  return exprToSQL(where);
}

exports.groupby = function(groupby, options) {
  return getExprListSQL(groupby).join(', ');
}

exports.orderby = function(orderby, options) {
  var cs = [];
  for (var i = 0; i < orderby.length; i++) {
    var o = orderby[i];
    var str = exprToSQL(o.expr);
    str += ' ' + o.type;
    cs.push(str);
  }
  return cs.join(', ');
}

exports.limit = function(limitOffset, options) {
  var limit = limitOffset[1].value;
  var offset = limitOffset[0].value;

  var str = limit;
  if (offset > 0) str += ' OFFSET ' + offset;
  return str;
}

exports.parse = function(s, options) {
  var clauses = [];
  var i, str, cs;

  options = options || {};

  clauses.push('SELECT');
  //distinct
  if (s.distinct) {
    clauses.push(exports.distinct(s.distinct, options));
  }

  //column clause
  //inspect(columns);
  clauses.push(exports.columns(s.columns, options));

  //from clause
  if (Array.isArray(s.from)) {
    clauses.push('FROM ' + exports.from(s.from, options));
  }

  //where clause
  if (s.where) {
    clauses.push('WHERE ' + exports.where(s.where, options));
  }

  if (Array.isArray(s.groupby)) {
    clauses.push('GROUP BY ' + exports.groupby(s.groupby, options));
  }

  if (Array.isArray(s.orderby)) {
    clauses.push('ORDER BY ' + exports.orderby(s.orderby, options));
  }

  if (Array.isArray(s.limit)) {
    clauses.push('LIMIT ' + exports.limit(s.limit, options));
  }

  return clauses.join(' ');
}
