import { gql } from "@/lib/generated/gql-codegen";

export const RejectionAppealsUserInfo = gql(`
  fragment RejectionAppealsUserInfo on RejectionAppeal {
    _id
    createdAt
    postId
    commentId
    status
  }
`);

export const RejectionAppealsModerationInfo = gql(`
  fragment RejectionAppealsModerationInfo on RejectionAppeal {
    ...RejectionAppealsUserInfo
    explanation
    post {
      ...SunshinePostsList
    }
    comment {
      ...SunshineCommentsList
    }
    conversation {
      ...TeamInboxConversation
    }
  }
`);
