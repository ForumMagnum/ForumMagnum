import schema from "@/lib/collections/reports/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ReportsViews } from "@/lib/collections/reports/views";

export const graphqlReportQueryTypeDefs = gql`
  type Report ${ getAllGraphQLFields(schema) }
  
  input SingleReportInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleReportOutput {
    result: Report
  }
  
  input ReportDefaultViewInput
  
  input ReportsAllReportsInput
  
  input ReportsUnclaimedReportsInput
  
  input ReportsClaimedReportsInput
  
  input ReportsAdminClaimedReportsInput {
    userId: String
  }
  
  input ReportsSunshineSidebarReportsInput
  
  input ReportsClosedReportsInput
  
  input ReportSelector  {
    default: ReportDefaultViewInput
    allReports: ReportsAllReportsInput
    unclaimedReports: ReportsUnclaimedReportsInput
    claimedReports: ReportsClaimedReportsInput
    adminClaimedReports: ReportsAdminClaimedReportsInput
    sunshineSidebarReports: ReportsSunshineSidebarReportsInput
    closedReports: ReportsClosedReportsInput
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
    report(
      input: SingleReportInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleReportOutput
    reports(
      input: MultiReportInput @deprecated(reason: "Use the selector field instead"),
      selector: ReportSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiReportOutput
  }
`;
export const reportGqlQueryHandlers = getDefaultResolvers('Reports', ReportsViews);
export const reportGqlFieldResolvers = getFieldGqlResolvers('Reports', schema);
