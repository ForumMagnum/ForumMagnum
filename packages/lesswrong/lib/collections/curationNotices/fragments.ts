import { frag } from "@/lib/fragments/fragmentWrapper";

export const CurationNoticesFragment = () => gql`
  fragment CurationNoticesFragment on CurationNotice {
    _id
    createdAt
    userId
    user {
      ...UsersMinimumInfo
    }
    commentId
    comment {
      ...CommentsList
    }
    postId
    post {
      ...PostsMinimumInfo
    }
    deleted
    contents {
      ...RevisionEdit
    }
  }
`
