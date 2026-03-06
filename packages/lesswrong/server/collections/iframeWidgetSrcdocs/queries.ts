import schema from "@/lib/collections/iframeWidgetSrcdocs/newSchema";
import { IframeWidgetSrcdocsViews } from "@/lib/collections/iframeWidgetSrcdocs/views";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlIframeWidgetSrcdocQueryTypeDefs = gql`
  type IframeWidgetSrcdoc ${ getAllGraphQLFields(schema) }

  type SingleIframeWidgetSrcdocOutput {
    result: IframeWidgetSrcdoc
  }

  input IframeWidgetSrcdocSelector {
    default: EmptyViewInput
  }

  type MultiIframeWidgetSrcdocOutput {
    results: [IframeWidgetSrcdoc!]!
    totalCount: Int
  }

  extend type Query {
    iframeWidgetSrcdoc(
      selector: SelectorInput
    ): SingleIframeWidgetSrcdocOutput
    iframeWidgetSrcdocs(
      selector: IframeWidgetSrcdocSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiIframeWidgetSrcdocOutput
  }
`;

export const iframeWidgetSrcdocGqlQueryHandlers = getDefaultResolvers('IframeWidgetSrcdocs', IframeWidgetSrcdocsViews);
export const iframeWidgetSrcdocGqlFieldResolvers = getFieldGqlResolvers('IframeWidgetSrcdocs', schema);
