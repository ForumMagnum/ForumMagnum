import schema from "@/lib/collections/postRelations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPostRelationQueryTypeDefs = gql`
  type PostRelation ${
    getAllGraphQLFields(schema)
  }

  input SinglePostRelationInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePostRelationOutput {
    result: PostRelation
  }

  input MultiPostRelationInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostRelationOutput {
    results: [PostRelation]
    totalCount: Int
  }

  extend type Query {
    postRelation(input: SinglePostRelationInput): SinglePostRelationOutput
    postRelations(input: MultiPostRelationInput): MultiPostRelationOutput
  }
`;

export const postRelationGqlQueryHandlers = getDefaultResolvers('PostRelations');
export const postRelationGqlFieldResolvers = getFieldGqlResolvers('PostRelations', schema);
