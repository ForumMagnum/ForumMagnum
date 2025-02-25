import { registerFragment } from '../../vulcan-lib/fragments';


registerFragment(`
  fragment SuggestAlignmentPost on Post {
    ...PostsList
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`)
