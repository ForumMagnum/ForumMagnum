export const JargonTerms = `
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

export const JargonTermsPost = `
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

export const JargonTermsWithPostInfo = `
  fragment JargonTermsWithPostInfo on JargonTerm {
    ...JargonTerms
    post {
      ...PostsMinimumInfo
    }
  }
`
