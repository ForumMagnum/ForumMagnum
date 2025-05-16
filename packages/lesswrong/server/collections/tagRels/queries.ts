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
  
  input TagRelDefaultViewInput
  
  input TagRelsPostsWithTagInput {
    tagId: String
  }
  
  input TagRelsTagsOnPostInput {
    postId: String
  }
  
  input TagRelSelector  {
    default: TagRelDefaultViewInput
    postsWithTag: TagRelsPostsWithTagInput
    tagsOnPost: TagRelsTagsOnPostInput
  }
  
  input MultiTagRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
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
