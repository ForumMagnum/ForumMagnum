export const SuggestAlignmentPost = `
  fragment SuggestAlignmentPost on Post {
    ...PostsList
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`
