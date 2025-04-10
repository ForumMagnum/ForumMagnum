import schema from "@/lib/collections/curationNotices/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCurationNoticeQueryTypeDefs = gql`
  type CurationNotice {
    ${getAllGraphQLFields(schema)}
  }

  input SingleCurationNoticeInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleCurationNoticeOutput {
    result: CurationNotice
  }

  input MultiCurationNoticeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiCurationNoticeOutput {
    results: [CurationNotice]
    totalCount: Int
  }

  extend type Query {
    curationNotice(input: SingleCurationNoticeInput): SingleCurationNoticeOutput
    curationNotices(input: MultiCurationNoticeInput): MultiCurationNoticeOutput
  }
`;

export const curationNoticeGqlQueryHandlers = getDefaultResolvers('CurationNotices');
export const curationNoticeGqlFieldResolvers = getFieldGqlResolvers('CurationNotices', schema);
