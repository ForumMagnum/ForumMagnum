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
  
  input SequenceDefaultViewInput {
    sequenceIds: String
  }
  
  input SequencesUserProfileInput {
    sequenceIds: String
    userId: String
  }
  
  input SequencesUserProfilePrivateInput {
    sequenceIds: String
    userId: String
  }
  
  input SequencesUserProfileAllInput {
    sequenceIds: String
    userId: String
  }
  
  input SequencesCuratedSequencesInput {
    sequenceIds: String
    userId: String
  }
  
  input SequencesCommunitySequencesInput {
    sequenceIds: String
    userId: String
  }
  
  input SequenceSelector  {
    default: SequenceDefaultViewInput
    userProfile: SequencesUserProfileInput
    userProfilePrivate: SequencesUserProfilePrivateInput
    userProfileAll: SequencesUserProfileAllInput
    curatedSequences: SequencesCuratedSequencesInput
    communitySequences: SequencesCommunitySequencesInput
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
