import schema from "@/lib/collections/gardencodes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { GardenCodesViews } from "@/lib/collections/gardencodes/views";

export const graphqlGardencodeQueryTypeDefs = gql`
  type GardenCode ${ getAllGraphQLFields(schema) }
  
  input SingleGardenCodeInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleGardenCodeOutput {
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
  
  input GardenCodeSelector  {
    default: GardenCodeDefaultViewInput
    usersPrivateGardenCodes: GardenCodesUsersPrivateGardenCodesInput
    publicGardenCodes: GardenCodesPublicGardenCodesInput
    gardenCodeByCode: GardenCodesGardenCodeByCodeInput
  }
  
  input MultiGardenCodeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiGardenCodeOutput {
    results: [GardenCode]
    totalCount: Int
  }
  
  extend type Query {
    gardenCode(
      input: SingleGardenCodeInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleGardenCodeOutput
    gardenCodes(
      input: MultiGardenCodeInput @deprecated(reason: "Use the selector field instead"),
      selector: GardenCodeSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiGardenCodeOutput
  }
`;
export const gardencodeGqlQueryHandlers = getDefaultResolvers('GardenCodes', GardenCodesViews);
export const gardencodeGqlFieldResolvers = getFieldGqlResolvers('GardenCodes', schema);
