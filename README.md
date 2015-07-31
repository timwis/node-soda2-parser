# SODA2 Parser
Parse Socrata's [SODA2 API](http://dev.socrata.com/docs/queries.html) to [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST). This library is 99% [node-sqlparser](https://github.com/alibaba/nquery) and 1% SODA2 to SQL with SODA2 unit tests.

# Usage

```javascript
var Parser = require('node-soda2-parser');
var ast = Parser.parse("$select=date, type, magnitude&$where=magnitude > 3.0 and source = 'pr'&$group=type");
```

#### Parses to:

```javascript
{ type: 'select',
  distinct: null,
  columns:
   [ { expr: { type: 'column_ref', table: '', column: 'date' },
       as: null },
     { expr: { type: 'column_ref', table: '', column: 'type' },
       as: null },
     { expr: { type: 'column_ref', table: '', column: 'magnitude' },
       as: null } ],
  from: null,
  where:
   { type: 'binary_expr',
     operator: 'AND',
     left:
      { type: 'binary_expr',
        operator: '>',
        left: { type: 'column_ref', table: '', column: 'magnitude' },
        right: { type: 'number', value: 3 } },
     right:
      { type: 'binary_expr',
        operator: '=',
        left: { type: 'column_ref', table: '', column: 'source' },
        right: { type: 'string', value: 'pr' } } },
  groupby: [ { type: 'column_ref', table: '', column: 'type' } ],
  orderby: null,
  limit: null,
  params: [] }
```
With this AST, you can:

- Convert it to clean SQL using `Parser.stringify(ast)`
- Write recursive functions to translate it to another query language
- Write recursive functions to interact with an ORM
- Print it out and hang it on the wall

## Supported
Unit tests in `test/soda` ensure the following functionality from the [SODA2 docs](http://dev.socrata.com/docs/queries.html) (which is basically everything except what's listed under Unsupported)
### $select
- Multiple fields
- Field aliases
- Functions, ie. `$select=date_trunc_ym(datetime) AS month`
- Operators, ie. `$select=depth * 3.28 AS depth_feet`

### $where
- Basic filters, ie. `foo=bar&animal=lion`
- Expressions
- Recursive And/Or
- Functions, ie. `$where=within_box(incident_location, 47.5998951, -122.33707, 47.5942794, -122.3270522)`
- Between, ie. `$where=date between '2015-01-10T12:00:00' and '2015-01-10T14:00:00'`
- Operators, ie. `$where=end - start < 1`
- Modulo, ie. `$where=foo % 2`

### Other
- $group
- $order
- $limit
- $offset

## Unsupported
The following was tested and does not parse

- **Not** between, ie. `$where=date not between '2015-01-10T12:00:00' and '2015-01-10T14:00:00'` ([reference](http://dev.socrata.com/docs/functions/not_between.html))
- Escaping single quote by doubling, ie. `$where=text_value='Bob''s string'` ([reference](http://dev.socrata.com/docs/datatypes/text.html))
- Double pipe concatenate, ie. `$select=theft_date, dc_dist || dc_num AS dist_dc` ([reference](http://dev.socrata.com/docs/datatypes/text.html))
- Free text search, ie. `$q=foobar` ([reference](http://dev.socrata.com/docs/queries.html#search-with-q)) ([see issue](https://github.com/timwis/node-soda2-parser/issues/1))
