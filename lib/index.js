// A generic error object used to mask the real js error.
// When an error occurs while resolving a field, this error
// will be sent to the client instead of the real error.
// Use `GraphQLError` to send error messages to users.
export const InternalError = new Error('internal error');


// If a `GraphQLError` is thrown when resolving the field
// it will be sent to the client without any modifications.
export class GraphQLError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'Error';
    this.message = args[0];
    Error.captureStackTrace(this, 'Error');

    // TODO
    // for some reasons instanceof did not work
    // using a temporary field until it's fixed.
    this._isGraphQLError = true;
  }
}


// Override the resolve function of a field to mask resolve errors.
// When an error occurs, it will be logged using `console.error`
// and a more general `InternalError` will be sent to the client.
export function processField(field) {
  const resolveFn = field.resolve;
  if (!resolveFn) {
    return;
  }

  field.resolve = async function (...args) {
    try {
      const out = resolveFn.call(this, ...args);
      return await Promise.resolve(out);
    } catch (e) {
      // TODO
      // `e instanceof GraphQLError` didn't work
      // using a temporary field until it's fixed.
      if (e._isGraphQLError) {
        throw e;
      }

      console.error(e && e.stack || e);
      throw InternalError;
    }
  };
}


// Overrides resolve functions for all fields in a GraphQL type
export function processType(type) {
  if (!type.getFields) {
    return;
  }

  const fields = type.getFields();
  for (const fieldName in fields) {
    if (!fields.hasOwnProperty(fieldName)) {
      continue;
    }

    processField(fields[fieldName]);
  }
}


// Overrides resolve functions for all types in a GraphQL schema
export function processSchema(schema) {
  const types = schema.getTypeMap();
  for (const typeName in types) {
    if (!types.hasOwnProperty(typeName)) {
      continue;
    }

    processType(types[typeName]);
  }
}
