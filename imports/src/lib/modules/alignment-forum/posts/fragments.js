import { registerFragment } from 'vulcan:core';


registerFragment(`
  fragment SuggestAlignmentPost on Post {
    ...PostsList
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`)
