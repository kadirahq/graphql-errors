import {describe, it} from 'mocha';
import {expect} from 'chai';
import {InternalError, GraphQLError} from '../';

import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

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

      rejectPromise: {
        type: GraphQLString,
        resolve() {
          return new Promise(function (resolve, reject) {
            reject(new Error('secret error'));
          });
        },
      },

      throwUserError: {
        type: GraphQLString,
        resolve() { throw new GraphQLError('custom error'); },
      },
    },
  })
});

describe('Errors', () => {
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
    const res = await graphql(schema, '{ throwUserError }');
    expect(res.errors[0].message).to.equal('custom error');
  });
});
