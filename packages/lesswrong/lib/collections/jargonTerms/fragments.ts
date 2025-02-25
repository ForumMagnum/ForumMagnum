import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
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
`);

registerFragment(`
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
`);

registerFragment(`
  fragment JargonTermsWithPostInfo on JargonTerm {
    ...JargonTerms
    post {
      ...PostsMinimumInfo
    }
  }
`);
