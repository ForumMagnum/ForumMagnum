import { registerFragment } from '../../vulcan-lib';

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
