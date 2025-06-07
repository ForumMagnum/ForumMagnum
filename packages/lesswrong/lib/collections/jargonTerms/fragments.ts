import { gql } from "@/lib/crud/wrapGql";

export const JargonTerms = gql(`
  fragment JargonTerms on JargonTerm {
    _id
    postId
    term
    contents {
      ...RevisionEdit
    }
    humansAndOrAIEdited
    approved
    deleted
    altTerms
  }
`)

export const JargonTermsPost = gql(`
  fragment JargonTermsPost on JargonTerm {
    _id
    term
    humansAndOrAIEdited
    approved
    deleted
    altTerms
    contents {
      ...RevisionDisplay
    }
  }
`)

export const JargonTermsWithPostInfo = gql(`
  fragment JargonTermsWithPostInfo on JargonTerm {
    ...JargonTerms
    post {
      ...PostsMinimumInfo
    }
  }
`)
