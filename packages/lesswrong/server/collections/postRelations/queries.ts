import schema from "@/lib/collections/postRelations/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { PostRelationsViews } from "@/lib/collections/postRelations/views";

export const graphqlPostRelationQueryTypeDefs = gql`
  type PostRelation ${ getAllGraphQLFields(schema) }
  
  input SinglePostRelationInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePostRelationOutput {
    result: PostRelation
  }
  
  input PostRelationViewInput {
    postId: String
   }
  
  input PostRelationSelector @oneOf {
    default: PostRelationViewInput
    allPostRelations: PostRelationViewInput
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
    postRelation(
      input: SinglePostRelationInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePostRelationOutput
    postRelations(
      input: MultiPostRelationInput @deprecated(reason: "Use the selector field instead"),
      selector: PostRelationSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPostRelationOutput
  }
`;
export const postRelationGqlQueryHandlers = getDefaultResolvers('PostRelations', PostRelationsViews);
export const postRelationGqlFieldResolvers = getFieldGqlResolvers('PostRelations', schema);
