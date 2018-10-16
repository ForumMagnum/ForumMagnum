import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment SuggestAlignmentComment on Comment {
    ...CommentsList
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`)
