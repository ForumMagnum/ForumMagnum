import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment TypingIndicatorInfo on TypingIndicator {
    _id
    userId
    documentId
    lastUpdated
  }
`);
