import {before, describe, it} from 'mocha';
import {expect} from 'chai';

import {
  GraphQLError,
  InternalError,
  processSchema,
} from '../';

import {
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';


// A simple graphql schema to run tests
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      throwError: {
        type: GraphQLString,
        resolve() { throw new Error('secret error'); },
      },

      throwInPromise: {
        type: GraphQLString,
        resolve() {
          return new Promise(function () {
            throw new Error('secret error');
          });
        },
      },

      throwGraphQLError: {
        type: GraphQLString,
        resolve() { throw new GraphQLError('custom error'); },
      },

      rejectPromise: {
        type: GraphQLString,
        resolve() {
          return new Promise(function (resolve, reject) {
            reject(new Error('secret error'));
          });
        },
      },
    },
  })
});


describe('Errors', () => {
  before(function () {
    // mask resolve erorrs
    processSchema(schema);
  });

  it('should catch javascript exceptions', async function () {
    const res = await graphql(schema, '{ throwError }');
    expect(res.errors[0].message).to.equal(InternalError.message);
  });

  it('should catch promise exceptions', async function () {
    const res = await graphql(schema, '{ throwInPromise }');
    expect(res.errors[0].message).to.equal(InternalError.message);
  });

  it('should catch promise rejections', async function () {
    const res = await graphql(schema, '{ rejectPromise }');
    expect(res.errors[0].message).to.equal(InternalError.message);
  });

  it('should forward GraphQLErrors', async function () {
    const res = await graphql(schema, '{ throwGraphQLError }');
    expect(res.errors[0].message).to.equal('custom error');
  });
});
