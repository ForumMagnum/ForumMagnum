import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment JargonTermsFragment on JargonTerm {
    _id
    postId
    term
    contents {
      ...RevisionEdit
    }
    humansAndOrAIEdited
    forLaTeX
    rejected
    altTerms
  }
`);

registerFragment(`
  fragment PostJargonTermsFragment on Post {
    _id
    term
    humansAndOrAIEdited
    forLaTeX
    altTerms
    contents {
      ...RevisionDisplay
    }
  }
`);
