import schema from "@/lib/collections/featuredResources/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { FeaturedResourcesViews } from "@/lib/collections/featuredResources/views";

export const graphqlFeaturedResourceQueryTypeDefs = gql`
  type FeaturedResource ${ getAllGraphQLFields(schema) }
  
  input SingleFeaturedResourceInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleFeaturedResourceOutput {
    result: FeaturedResource
  }
  
  input FeaturedResourceViewInput
  
  input FeaturedResourceSelector @oneOf {
    default: FeaturedResourceViewInput
    activeResources: FeaturedResourceViewInput
  }
  
  input MultiFeaturedResourceInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiFeaturedResourceOutput {
    results: [FeaturedResource]
    totalCount: Int
  }
  
  extend type Query {
    featuredResource(
      input: SingleFeaturedResourceInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleFeaturedResourceOutput
    featuredResources(
      input: MultiFeaturedResourceInput @deprecated(reason: "Use the selector field instead"),
      selector: FeaturedResourceSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiFeaturedResourceOutput
  }
`;
export const featuredResourceGqlQueryHandlers = getDefaultResolvers('FeaturedResources', FeaturedResourcesViews);
export const featuredResourceGqlFieldResolvers = getFieldGqlResolvers('FeaturedResources', schema);
