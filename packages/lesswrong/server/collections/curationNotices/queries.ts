import schema from "@/lib/collections/curationNotices/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CurationNoticesViews } from "@/lib/collections/curationNotices/views";

export const graphqlCurationNoticeQueryTypeDefs = gql`
  type CurationNotice ${ getAllGraphQLFields(schema) }
  
  input SingleCurationNoticeInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleCurationNoticeOutput {
    result: CurationNotice
  }
  
  input CurationNoticeSelector {
    default: EmptyViewInput
    curationNoticesPage: EmptyViewInput
  }
  
  input MultiCurationNoticeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiCurationNoticeOutput {
    results: [CurationNotice!]!
    totalCount: Int
  }
  
  extend type Query {
    curationNotice(
      input: SingleCurationNoticeInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleCurationNoticeOutput
    curationNotices(
      input: MultiCurationNoticeInput @deprecated(reason: "Use the selector field instead"),
      selector: CurationNoticeSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiCurationNoticeOutput
  }
`;
export const curationNoticeGqlQueryHandlers = getDefaultResolvers('CurationNotices', CurationNoticesViews);
export const curationNoticeGqlFieldResolvers = getFieldGqlResolvers('CurationNotices', schema);
