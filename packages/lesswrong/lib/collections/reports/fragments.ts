import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment unclaimedReportsList on Report {
    _id
    userId
    user {
      _id
      displayName
      username
      slug
    }
    commentId
    comment {
      _id
      userId
      user {
        ...UsersMinimumInfo
      }
      baseScore
      contents {
        ...RevisionDisplay
      }
      postedAt
      deleted
      postId
      post {
        _id
        slug
        title
        isEvent
      }
    }
    postId
    post {
      _id
      slug
      title
      isEvent
      contents {
        ...RevisionDisplay
      }
    }
    reportedUser {
      ...SunshineUsersList
    }
    closedAt
    createdAt
    claimedUserId
    claimedUser {
      _id
      displayName
      username
      slug
    }
    link
    description
    reportedAsSpam
    markedAsSpam
  }
`);
