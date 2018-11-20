import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment NewAnswer on Comment {
    userId
    body
    htmlBody
    content
    answercontent
    af
  }
`);
