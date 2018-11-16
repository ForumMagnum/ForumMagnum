import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment EditQuestion on Post {
    userId
    body
    htmlBody
    content
    title
    question
  }
`);
