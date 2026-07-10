import schema from "@/lib/collections/typoSuggestions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { TypoSuggestionsViews } from "@/lib/collections/typoSuggestions/views";

export const graphqlTypoSuggestionQueryTypeDefs = gql`
  type TypoSuggestion ${ getAllGraphQLFields(schema) }

  input SingleTypoSuggestionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleTypoSuggestionOutput {
    result: TypoSuggestion
  }

  input TypoSuggestionSelector {
    default: EmptyViewInput
  }

  input MultiTypoSuggestionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiTypoSuggestionOutput {
    results: [TypoSuggestion!]!
    totalCount: Int
  }

  extend type Query {
    typoSuggestion(
      input: SingleTypoSuggestionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleTypoSuggestionOutput
    typoSuggestions(
      input: MultiTypoSuggestionInput @deprecated(reason: "Use the selector field instead"),
      selector: TypoSuggestionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiTypoSuggestionOutput
  }
`;

export const typoSuggestionGqlQueryHandlers = getDefaultResolvers('TypoSuggestions', TypoSuggestionsViews);
export const typoSuggestionGqlFieldResolvers = getFieldGqlResolvers('TypoSuggestions', schema);
