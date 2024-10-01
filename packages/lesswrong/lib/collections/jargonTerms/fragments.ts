import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment JargonTermsFragment on JargonTerms {
    _id
    postId
    term
    contents {
      ...RevisionEdit
    }
    humansAndOrAIEdited
    forLaTeX
    rejected
  }
`);
