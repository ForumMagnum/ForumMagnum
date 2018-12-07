import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment EditModerationGuidelines on Post {
    moderationGuidelinesBody,
    moderationGuidelinesContent,
    moderationGuidelinesHtmlBody,
    moderationStyle
  }
`);
