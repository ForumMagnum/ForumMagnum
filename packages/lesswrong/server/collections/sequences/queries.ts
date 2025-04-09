import schema from "@/lib/collections/sequences/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlSequenceQueryTypeDefs = gql`
  type Sequence {
    ${getAllGraphQLFields(schema)}
  }

  input SingleSequenceInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleSequenceOutput {
    result: Sequence
  }

  input MultiSequenceInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiSequenceOutput {
    results: [Sequence]
    totalCount: Int
  }

  extend type Query {
    sequence(input: SingleSequenceInput): SingleSequenceOutput
    sequences(input: MultiSequenceInput): MultiSequenceOutput
  }
`;

export const sequenceGqlQueryHandlers = getDefaultResolvers('Sequences');
export const sequenceGqlFieldResolvers = getFieldGqlResolvers('Sequences', schema);
