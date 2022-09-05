import { testStartup } from './testMain';
import { graphqlTypeToTypescript } from '../server/codegen/typeGenerationUtils';
import { generateQueryArgumentsTypeDefinition, generateQueryTypes, graphqlTypeDeclarationStrToTypescript } from '../server/codegen/generateQueryTypes';
import chai from 'chai';
import gql from 'graphql-tag';

testStartup();

function getTestTypeGenerationContext(): TypeGenerationContext {
  // TODO
  return {} as unknown as TypeGenerationContext;
}

// Type generation operations:
//  * Given a query or mutation, find the resolvers and their types
//  * Given a resolver, extract its return type
//  * Given a TS type, convert it to Typescript
//  * Given a subselector that matches a collection field, get its TS type
//  * Given a subselector that matches a TS type, get its TS type

describe('Codegen', function() {
  it('maps primitive graphql types to typescript', () => {
    chai.assert.equal(
      graphqlTypeToTypescript("Int!"),
      "number"
    );
  });
  it('converts graphql type declarations', () => {
    chai.assert.equal(
      graphqlTypeDeclarationStrToTypescript(context, "type TestInterface { x: Int! }"),
      "interface TestInterface {\n  x: number\n}\n",
    );
  });
  /*it('extracts arguments from queries', () => {
    const context: TypeGenerationContext = getTestTypeGenerationContext();
    generateQueryArgumentsTypeDefinition(
      context, "TestQuery", gql(`
        query TestQuery($n: Int, $s: String!) {
          x
        }
      `).definitions[0]
    );
    //TODO
  });*/
  it('generates query types', () => {
    const context: TypeGenerationContext = getTestTypeGenerationContext();
    generateQueryTypes(context);
  });
});
