import schema from "@/lib/collections/tagRels/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { TagRelsViews } from "@/lib/collections/tagRels/views";

export const graphqlTagRelQueryTypeDefs = gql`
  type TagRel ${ getAllGraphQLFields(schema) }
  
  input SingleTagRelInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleTagRelOutput {
    result: TagRel
  }
  
  input TagRelViewInput {
    tagId: String
    postId: String
   }
  
  input TagRelSelector @oneOf {
    default: TagRelViewInput
    postsWithTag: TagRelViewInput
    tagsOnPost: TagRelViewInput
  }
  
  input MultiTagRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiTagRelOutput {
    results: [TagRel]
    totalCount: Int
  }
  
  extend type Query {
    tagRel(
      input: SingleTagRelInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleTagRelOutput
    tagRels(
      input: MultiTagRelInput @deprecated(reason: "Use the selector field instead"),
      selector: TagRelSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiTagRelOutput
  }
`;
export const tagRelGqlQueryHandlers = getDefaultResolvers('TagRels', TagRelsViews);
export const tagRelGqlFieldResolvers = getFieldGqlResolvers('TagRels', schema);
