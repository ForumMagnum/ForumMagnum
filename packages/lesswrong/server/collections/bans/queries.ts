import schema from "@/lib/collections/bans/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlBanQueryTypeDefs = gql`
  type Ban ${ getAllGraphQLFields(schema) }
  
  input SingleBanInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleBanOutput {
    result: Ban
  }
  
  input BanViewInput
  
  input BanSelector  {
    default: BanViewInput
  }
  
  input MultiBanInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiBanOutput {
    results: [Ban]
    totalCount: Int
  }
  
  extend type Query {
    ban(
      input: SingleBanInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleBanOutput
    bans(
      input: MultiBanInput @deprecated(reason: "Use the selector field instead"),
      selector: BanSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiBanOutput
  }
`;
export const banGqlQueryHandlers = getDefaultResolvers('Bans', new CollectionViewSet('Bans', {}));
export const banGqlFieldResolvers = getFieldGqlResolvers('Bans', schema);
