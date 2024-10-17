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
    approved
    deleted
    altTerms
  }
`);

registerFragment(`
  fragment JargonTermsPostFragment on JargonTerm {
    _id
    term
    humansAndOrAIEdited
    altTerms
    contents {
      ...RevisionDisplay
    }
  }
`);
