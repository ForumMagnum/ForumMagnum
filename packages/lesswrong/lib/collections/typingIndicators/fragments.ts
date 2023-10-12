import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TypingIndicatorInfo on TypingIndicator {
    _id
    userId
    documentId
    lastUpdated
  }
`);
