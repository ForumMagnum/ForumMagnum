import schema from "@/lib/collections/subscriptions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSubscriptionQueryTypeDefs = gql`
  type Subscription {
    ${getAllGraphQLFields(schema)}
  }

  input SingleSubscriptionInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSubscriptionOutput {
    result: Subscription
  }

  input MultiSubscriptionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSubscriptionOutput {
    results: [Subscription]
    totalCount: Int
  }

  extend type Query {
    subscription(input: SingleSubscriptionInput): SingleSubscriptionOutput
    subscriptions(input: MultiSubscriptionInput): MultiSubscriptionOutput
  }
`;

export const subscriptionGqlQueryHandlers = getDefaultResolvers('Subscriptions');
export const subscriptionGqlFieldResolvers = getFieldGqlResolvers('Subscriptions', schema);
