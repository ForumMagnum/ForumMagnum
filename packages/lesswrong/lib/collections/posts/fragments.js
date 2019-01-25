import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment EditModerationGuidelines on Post {
    moderationGuidelinesBody,
    moderationGuidelines {
      version
      updateType
      editedAt
      userId
      canonicalContent
      html
      markdown
      draftJS
      wordCount
      htmlHighlight
      plaintextDescription
    },
    moderationGuidelinesHtmlBody,
    moderationStyle
  }
`);

registerFragment(`
  fragment PostsRevisionsList on Post {
    _id
    revisions {
      version
      editedAt
    }
  }
`)
