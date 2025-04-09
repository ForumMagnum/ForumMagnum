import { frag } from "@/lib/fragments/fragmentWrapper";

export const UnclaimedReportsList = () => gql`
  fragment UnclaimedReportsList on Report {
    _id
    userId
    user {
      ...UsersMinimumInfo
    }
    commentId
    comment {
      ...CommentsList
      post {
        ...PostsMinimumInfo
      }
      tag {
        ...TagBasicInfo
      }
    }
    postId
    post {
      ...PostsList
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
`
