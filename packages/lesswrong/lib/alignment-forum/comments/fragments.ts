export const SuggestAlignmentComment = `
  fragment SuggestAlignmentComment on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    suggestForAlignmentUserIds
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`
