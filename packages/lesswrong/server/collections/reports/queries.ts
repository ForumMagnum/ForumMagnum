import schema from "@/lib/collections/reports/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlReportQueryTypeDefs = gql`
  type Report {
    ${getAllGraphQLFields(schema)}
  }

  input SingleReportInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleReportOutput {
    result: Report
  }

  input MultiReportInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiReportOutput {
    results: [Report]
    totalCount: Int
  }

  extend type Query {
    report(input: SingleReportInput): SingleReportOutput
    reports(input: MultiReportInput): MultiReportOutput
  }
`;

export const reportGqlQueryHandlers = getDefaultResolvers('Reports');
export const reportGqlFieldResolvers = getFieldGqlResolvers('Reports', schema);
