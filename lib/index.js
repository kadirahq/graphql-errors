import {
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';


// Mark field/type/schema
export const Processed = Symbol();


// Used to identify UserErrors
export const IsUserError = Symbol();


// UserErrors will be sent to the user
export class UserError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'Error';
    this.message = args[0];
    this[IsUserError] = true;
    Error.captureStackTrace(this, 'Error');
  }
}


// Modifies errors before sending to the user
export let defaultHandler = function (err) {
  if (err[IsUserError]) {
    return err;
  }
  console.error(err && err.stack || err);
  err.message = 'internal server error';
  return err;
};


// Changes the default error handler function
export function setDefaultHandler(handlerFn) {
  defaultHandler = handlerFn;
}


// Masks graphql schemas, types or individual fields
export function maskErrors(thing, fn = defaultHandler) {
  if (thing instanceof GraphQLSchema) {
    maskSchema(thing, fn);
  } else if (thing instanceof GraphQLObjectType) {
    maskType(thing, fn);
  } else {
    maskField(thing, fn);
  }
}


function maskField(field, fn) {
  const resolveFn = field.resolve;
  if (field[Processed] || !resolveFn) {
    return;
  }

  field[Processed] = true;
  field.resolve = async function (...args) {
    try {
      const out = resolveFn.call(this, ...args);
      return await Promise.resolve(out);
    } catch (e) {
      throw fn(e);
    }
  };

  // save the original resolve function
  field.resolve._resolveFn = resolveFn;
}


function maskType(type, fn) {
  if (type[Processed] || !type.getFields) {
    return;
  }

  const fields = type.getFields();
  for (const fieldName in fields) {
    if (!fields.hasOwnProperty(fieldName)) {
      continue;
    }

    maskField(fields[fieldName], fn);
  }
}


function maskSchema(schema, fn) {
  const types = schema.getTypeMap();
  for (const typeName in types) {
    if (!types.hasOwnProperty(typeName)) {
      continue;
    }

    maskType(types[typeName], fn);
  }
}
