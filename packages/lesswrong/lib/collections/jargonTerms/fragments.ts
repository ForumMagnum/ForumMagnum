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
  }
`);
