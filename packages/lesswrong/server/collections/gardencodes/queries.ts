import schema from "@/lib/collections/gardencodes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { GardenCodesViews } from "@/lib/collections/gardencodes/views";

export const graphqlGardencodeQueryTypeDefs = gql`
  type GardenCode ${ getAllGraphQLFields(schema) }
  
  input SingleGardencodeInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleGardencodeOutput {
    result: GardenCode
  }
  
  input GardenCodeDefaultViewInput {
    types: String
    userId: String
    code: String
  }
  
  input GardenCodesUsersPrivateGardenCodesInput {
    types: String
    userId: String
    code: String
  }
  
  input GardenCodesPublicGardenCodesInput {
    types: String
    userId: String
    code: String
  }
  
  input GardenCodesGardenCodeByCodeInput {
    types: String
    userId: String
    code: String
  }
  
  input GardencodeSelector  {
    default: GardenCodeDefaultViewInput
    usersPrivateGardenCodes: GardenCodesUsersPrivateGardenCodesInput
    publicGardenCodes: GardenCodesPublicGardenCodesInput
    gardenCodeByCode: GardenCodesGardenCodeByCodeInput
  }
  
  input MultiGardencodeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiGardencodeOutput {
    results: [GardenCode]
    totalCount: Int
  }
  
  extend type Query {
    gardencode(
      input: SingleGardencodeInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleGardencodeOutput
    gardencodes(
      input: MultiGardencodeInput @deprecated(reason: "Use the selector field instead"),
      selector: GardencodeSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiGardencodeOutput
  }
`;
export const gardencodeGqlQueryHandlers = getDefaultResolvers('GardenCodes', GardenCodesViews);
export const gardencodeGqlFieldResolvers = getFieldGqlResolvers('GardenCodes', schema);
