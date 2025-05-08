import schema from "@/lib/collections/subscriptions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { SubscriptionsViews } from "@/lib/collections/subscriptions/views";

export const graphqlSubscriptionQueryTypeDefs = gql`
  type Subscription ${ getAllGraphQLFields(schema) }
  
  input SingleSubscriptionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSubscriptionOutput {
    result: Subscription
  }
  
  input SubscriptionViewInput {
    userId: String
    collectionName: String
    subscriptionType: String
    documentId: String
    type: String
   }
  
  input SubscriptionSelector @oneOf {
    default: SubscriptionViewInput
    subscriptionState: SubscriptionViewInput
    subscriptionsOfType: SubscriptionViewInput
    membersOfGroup: SubscriptionViewInput
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
    subscription(
      input: SingleSubscriptionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSubscriptionOutput
    subscriptions(
      input: MultiSubscriptionInput @deprecated(reason: "Use the selector field instead"),
      selector: SubscriptionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSubscriptionOutput
  }
`;
export const subscriptionGqlQueryHandlers = getDefaultResolvers('Subscriptions', SubscriptionsViews);
export const subscriptionGqlFieldResolvers = getFieldGqlResolvers('Subscriptions', schema);
