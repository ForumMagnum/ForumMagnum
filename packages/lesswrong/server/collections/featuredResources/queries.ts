import schema from "@/lib/collections/featuredResources/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlFeaturedResourceQueryTypeDefs = gql`
  type FeaturedResource {
    ${getAllGraphQLFields(schema)}
  }

  input SingleFeaturedResourceInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleFeaturedResourceOutput {
    result: FeaturedResource
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
    featuredResource(input: SingleFeaturedResourceInput): SingleFeaturedResourceOutput
    featuredResources(input: MultiFeaturedResourceInput): MultiFeaturedResourceOutput
  }
`;

export const featuredResourceGqlQueryHandlers = getDefaultResolvers('FeaturedResources');
export const featuredResourceGqlFieldResolvers = getFieldGqlResolvers('FeaturedResources', schema);
