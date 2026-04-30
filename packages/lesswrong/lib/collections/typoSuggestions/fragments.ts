import { gql } from "@/lib/generated/gql-codegen";

export const TypoSuggestionsDefaultFragment = gql(`
  fragment TypoSuggestionsDefaultFragment on TypoSuggestion {
    _id
    createdAt
    documentId
    collectionName
    fieldName
    voteId
    reactor {
      ...UsersMinimumInfo
    }
    authorId
    author {
      ...UsersMinimumInfo
    }
    quote
    proposedReplacement
    narrowedQuote
    narrowedReplacement
    explanation
    llmVerdict
    status
    resolvedByUserId
    appliedRevisionId
    resolvedAt
    applyWouldRequirePublishingUnrelatedChanges
  }
`);
