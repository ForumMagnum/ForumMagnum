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
  
  input SubscriptionDefaultViewInput
  
  input SubscriptionsSubscriptionStateInput
  
  input SubscriptionsSubscriptionsOfTypeInput {
    userId: String
    collectionName: String
    subscriptionType: String
  }
  
  input SubscriptionsMembersOfGroupInput
  
  input SubscriptionSelector  {
    default: SubscriptionDefaultViewInput
    subscriptionState: SubscriptionsSubscriptionStateInput
    subscriptionsOfType: SubscriptionsSubscriptionsOfTypeInput
    membersOfGroup: SubscriptionsMembersOfGroupInput
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
