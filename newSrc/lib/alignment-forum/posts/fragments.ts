import { registerFragment } from '../../vulcan-lib';


registerFragment(`
  fragment SuggestAlignmentPost on Post {
    ...PostsList
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`)
