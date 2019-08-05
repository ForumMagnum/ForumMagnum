import { registerFragment } from 'vulcan:core';

registerFragment(`
  fragment SuggestAlignmentUser on User {
    ...UsersMinimumInfo
    afKarma
    afPostCount
    afCommentCount
    reviewForAlignmentForumUserId
    groups
    afApplicationText
    afSubmittedApplication
  }`)
