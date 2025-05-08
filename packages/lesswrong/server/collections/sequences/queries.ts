import schema from "@/lib/collections/sequences/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { SequencesViews } from "@/lib/collections/sequences/views";

export const graphqlSequenceQueryTypeDefs = gql`
  type Sequence ${ getAllGraphQLFields(schema) }
  
  input SingleSequenceInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleSequenceOutput {
    result: Sequence
  }
  
  input SequenceViewInput {
    userId: String
    sequenceIds: String
   }
  
  input SequenceSelector @oneOf {
    default: SequenceViewInput
    userProfile: SequenceViewInput
    userProfilePrivate: SequenceViewInput
    userProfileAll: SequenceViewInput
    curatedSequences: SequenceViewInput
    communitySequences: SequenceViewInput
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
    sequence(
      input: SingleSequenceInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleSequenceOutput
    sequences(
      input: MultiSequenceInput @deprecated(reason: "Use the selector field instead"),
      selector: SequenceSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiSequenceOutput
  }
`;
export const sequenceGqlQueryHandlers = getDefaultResolvers('Sequences', SequencesViews);
export const sequenceGqlFieldResolvers = getFieldGqlResolvers('Sequences', schema);
