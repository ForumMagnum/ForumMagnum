import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';

// Defines a graphql query. Use this for queries which don't fit well into the
// CRUD framework; for queries that just retrieve and sort a subset of a
// collection, use the views framework instead.
//
// IMPORTANT: The provided resolver function must do its own permissions
// checking.
//
// Arguments
//   name: (String) The name of the query. Must be unique within the namespace
//     of graphql definitions.
//   resultType: (String) A string describing a GraphQL type. If fn completes
//     without throwing an exception, it must return a value of this type.
//   argTypes: (Optional String) Arguments that this query takes, as a
//     parenthesized comma-separated list.
//   schema: (Optional String) A string with some GraphQL type definitions to
//     add to the schema, provided for convenience so you can define the types
//     referenced in resultType and argTypes in the same place.
//   fn: ((root,args,context)=>resultType). The GraphQL resolver.
export const defineQuery = ({name, resultType, argTypes=null, schema=null, fn}: {
  name: string,
  resultType: string,
  argTypes?: string|null,
  schema?: string|null,
  fn: (root: any, args: any, context: ResolverContext) => any,
}) => {
  if (schema) {
    addGraphQLSchema(schema);
  }
  
  addGraphQLResolvers({
    Query: {
      [name]: fn
    }
  });
  
  addGraphQLQuery(`${name}${argTypes ? argTypes : ""}: ${resultType}`);
}

export const defineMutation = ({name, resultType, argTypes=null, schema=null, fn}: {
  name: string,
  resultType: string,
  argTypes?: string|null,
  schema?: string|null,
  fn: (root: any, args: any, context: ResolverContext) => any,
}) => {
  if (schema) {
    addGraphQLSchema(schema);
  }
  
  addGraphQLResolvers({
    Mutation: {
      [name]: fn
    }
  });
  
  addGraphQLMutation(`${name}${argTypes ? argTypes : ""}: ${resultType}`);
}
