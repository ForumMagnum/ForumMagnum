import schema from "@/lib/collections/tagFlags/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { TagFlagsViews } from "@/lib/collections/tagFlags/views";

export const graphqlTagFlagQueryTypeDefs = gql`
  type TagFlag ${ getAllGraphQLFields(schema) }
  
  input SingleTagFlagInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleTagFlagOutput {
    result: TagFlag
  }
  
  input TagFlagDefaultViewInput
  
  input TagFlagsAllTagFlagsInput
  
  input TagFlagSelector  {
    default: TagFlagDefaultViewInput
    allTagFlags: TagFlagsAllTagFlagsInput
  }
  
  input MultiTagFlagInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiTagFlagOutput {
    results: [TagFlag]
    totalCount: Int
  }
  
  extend type Query {
    tagFlag(
      input: SingleTagFlagInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleTagFlagOutput
    tagFlags(
      input: MultiTagFlagInput @deprecated(reason: "Use the selector field instead"),
      selector: TagFlagSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiTagFlagOutput
  }
`;
export const tagFlagGqlQueryHandlers = getDefaultResolvers('TagFlags', TagFlagsViews);
export const tagFlagGqlFieldResolvers = getFieldGqlResolvers('TagFlags', schema);
