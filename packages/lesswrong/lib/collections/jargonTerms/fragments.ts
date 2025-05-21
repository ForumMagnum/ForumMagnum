import { frag } from "@/lib/fragments/fragmentWrapper"

export const JargonTerms = () => frag`
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
`

export const JargonTermsPost = () => frag`
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
`

export const JargonTermsWithPostInfo = () => frag`
  fragment JargonTermsWithPostInfo on JargonTerm {
    ...JargonTerms
    post {
      ...PostsMinimumInfo
    }
  }
`
