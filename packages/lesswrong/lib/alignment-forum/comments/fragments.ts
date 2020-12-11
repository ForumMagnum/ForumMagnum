import { registerFragment } from '../../vulcan-lib';

registerFragment(`
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
  }`)
