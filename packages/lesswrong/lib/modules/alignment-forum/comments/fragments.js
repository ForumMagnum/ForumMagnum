import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment SuggestAlignmentComment on Comment {
    ...CommentsList
    post {
      title
      _id
      slug
    }
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`)
