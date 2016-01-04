# GraphQL Errors

When an error occurs when processing GraphQL queries, [graphql-js](https://github.com/graphql/graphql-js) sends the complete error message to the client with the response. In most cases, sending error messages to the client without supervision is not recommended. The `graphql-errors` module fixes this issue by masking error messages sent to the client. This module intercepts GraphQL error messages and replaces them with `"internal error"`.

``` javascript
var express = require('express');
var graphql = require('graphql');
var graphqlHTTP = require('express-graphql');
var maskErrors = require('graphql-errors').maskErrors;

var schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      test: {
        type: graphql.GraphQLString,
        resolve() {
          throw new Error('secret error message');
        },
      },
    },
  }),
});

// mask error messages
maskErrors(schema);

var app = express();
app.use('/', graphqlHTTP({schema: schema}));
app.listen(3000);
```

To make error debugging easier, it logs the error on the server with the stack. The module can be activated on a schema using its `processSchema` function.
