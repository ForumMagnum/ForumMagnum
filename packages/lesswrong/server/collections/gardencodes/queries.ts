import schema from "@/lib/collections/gardencodes/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlGardenCodeQueryTypeDefs = gql`
  type GardenCode {
    ${getAllGraphQLFields(schema)}
  }

  input SingleGardenCodeInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleGardenCodeOutput {
    result: GardenCode
  }

  input MultiGardenCodeInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiGardenCodeOutput {
    results: [GardenCode]
    totalCount: Int
  }

  extend type Query {
    gardenCode(input: SingleGardenCodeInput): SingleGardenCodeOutput
    gardenCodes(input: MultiGardenCodeInput): MultiGardenCodeOutput
  }
`;

export const gardenCodeGqlQueryHandlers = getDefaultResolvers('GardenCodes');
export const gardenCodeGqlFieldResolvers = getFieldGqlResolvers('GardenCodes', schema);
