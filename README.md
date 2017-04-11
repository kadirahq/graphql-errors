# GraphQL Errors

When an error occurs when processing GraphQL queries, [graphql-js](https://github.com/graphql/graphql-js) sends the complete error message to the client with the response. In most cases, **sending error messages to the client without supervision is a bad idea** since those might leak sensitive information.

The `graphql-errors` module fixes this issue by **masking error messages sent to the client**. This module intercepts GraphQL error messages and replaces them with `"Internal error"` and a UUID. It also logs the error on the server with the stacktrace and it's UUID, making user bug reports easy to cross-reference.

## Usage

``` javascript
const { maskErrors } = require('graphql-errors');

const schema = new graphql.GraphQLSchema({
  // ...your schema here...
});

// Mask the error messages
maskErrors(schema);

// Use your schema like you normally would, for example:
app.use('/', graphqlHTTP({ schema: schema }));
```

### User errors

Some error messages you _do_ want to send to the user though, like permission errors, so `graphql-errors` exports a `UserError` class. Throwing a `UserError` will not mask the error message so your users sees the exact one you threw:

```JS
const { UserError } = require('graphql-errors')

const resolvers = {
  Query: {
    hiddenField() {
      // Your user sees: "Permission denied."
      throw new UserError('Permission denied.');
    }
  }
}
```

## Example Error

Let's say your database throws an error because you exceeded some limit. Normally your user would see an error message saying "Database limit exceeded.", but not with `graphql-errors`!

**What the user gets in the response**

```JSON
{
  "data": {
    "post": null
  },
  "errors": [
    {
      "message": "Internal Error: e553aaa4-47dc-47db-9bfc-314cc2cf5833",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": [
        "post"
      ]
    }
  ]
}
```

As you can see, no sensitive information is leaked to the user at all. You might think this'll make bug reports less useful, but note how a UUID is attached to the error message!

**What you see in the server console**

```
Error: Database limit exceeded.: e553aaa4-47dc-47db-9bfc-314cc2cf5833
    at post (/project/server/queries/post.js:10:35)
    at _callee$ (/project/node_modules/graphql-errors/dist/index.js:140:36)
    at tryCatch (/project/node_modules/regenerator-runtime/runtime.js:64:40)
    at Generator.invoke [as _invoke] (/project/node_modules/regenerator-runtime/runtime.js:355:22)
    at Generator.prototype.(anonymous function) [as next] (/project/node_modules/regenerator-runtime/runtime.js:116:21)
    at step (/project/node_modules/babel-runtime/helpers/asyncToGenerator.js:17:30)
    at /project/node_modules/babel-runtime/helpers/asyncToGenerator.js:35:14
    at F (/project/node_modules/babel-runtime/node_modules/core-js/library/modules/_export.js:35:28)
    at /project/node_modules/babel-runtime/helpers/asyncToGenerator.js:14:12
    at /project/node_modules/graphql-errors/dist/index.js:160:18
    at resolveOrError (/project/node_modules/graphql/execution/execute.js:475:12)
    at resolveField (/project/node_modules/graphql/execution/execute.js:461:16)
    at /project/node_modules/graphql/execution/execute.js:275:18
    at Array.reduce (native)
    at executeFields (/project/node_modules/graphql/execution/execute.js:272:42)
    at executeOperation (/project/node_modules/graphql/execution/execute.js:212:10)
```

Note how the same UUID (`"e553aaa4-47dc-47db-9bfc-314cc2cf5833"`) is sent to the user and logged together with the stack trace, making it easy to cross-reference user bug reports to your server logs.

