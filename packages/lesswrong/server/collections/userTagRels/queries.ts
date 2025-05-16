import schema from "@/lib/collections/userTagRels/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserTagRelsViews } from "@/lib/collections/userTagRels/views";

export const graphqlUserTagRelQueryTypeDefs = gql`
  type UserTagRel ${ getAllGraphQLFields(schema) }
  
  input SingleUserTagRelInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserTagRelOutput {
    result: UserTagRel
  }
  
  input UserTagRelDefaultViewInput
  
  input UserTagRelsSingleInput {
    userId: String
    tagId: String
  }
  
  input UserTagRelSelector  {
    default: UserTagRelDefaultViewInput
    single: UserTagRelsSingleInput
  }
  
  input MultiUserTagRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiUserTagRelOutput {
    results: [UserTagRel]
    totalCount: Int
  }
  
  extend type Query {
    userTagRel(
      input: SingleUserTagRelInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserTagRelOutput
    userTagRels(
      input: MultiUserTagRelInput @deprecated(reason: "Use the selector field instead"),
      selector: UserTagRelSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserTagRelOutput
  }
`;
export const userTagRelGqlQueryHandlers = getDefaultResolvers('UserTagRels', UserTagRelsViews);
export const userTagRelGqlFieldResolvers = getFieldGqlResolvers('UserTagRels', schema);
