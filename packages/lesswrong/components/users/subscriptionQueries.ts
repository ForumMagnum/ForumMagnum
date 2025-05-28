import { gql } from "@/lib/generated/gql-codegen";

export const subscribedUserQuery = gql(`
  query SubscribedUser($documentId: String!) {
    user(input: { selector: { _id: $documentId } }) {
      result {
        ...UsersMinimumInfo
      }
    }
  }
`);

export const subscribedPostQuery = gql(`
  query SubscribedPost($documentId: String!) {
    post(input: { selector: { _id: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

export const subscribedCommentQuery = gql(`
  query SubscribedComment($documentId: String!) {
    comment(input: { selector: { _id: $documentId } }) {
      result {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

export const subscribedLocalgroupQuery = gql(`
  query SubscribedLocalgroup($documentId: String!) {
    localgroup(input: { selector: { _id: $documentId } }) {
      result {
        ...localGroupsBase
      }
    }
  }
`);

export const subscribedTagQuery = gql(`
  query SubscribedTag($documentId: String!) {
    tag(input: { selector: { _id: $documentId } }) {
      result {
        ...TagPreviewFragment
      }
    }
  }
`);

export const subscribedSequenceQuery = gql(`
  query SubscribedSequence($documentId: String!) {
    sequence(input: { selector: { _id: $documentId } }) {
      result {
        ...SequencesPageTitleFragment
      }
    }
  }
`);
