import { gql } from "@/lib/generated/gql-codegen";

export const adminHomePageDesignsQuery = gql(`
  query AdminHomePageDesigns {
    adminHomePageDesigns {
      _id
      publicId
      title
      html
      verified
      autoReviewPassed
      autoReviewMessage
      createdAt
      source
      modelName
      commentId
      ownerDisplayName
      ownerSlug
    }
  }
`);

export const setHomePageDesignVerifiedMutation = gql(`
  mutation SetHomePageDesignVerified($designId: String!, $verified: Boolean, $autoReviewPassed: Boolean) {
    setHomePageDesignVerified(designId: $designId, verified: $verified, autoReviewPassed: $autoReviewPassed) {
      _id
      verified
      autoReviewPassed
      autoReviewMessage
    }
  }
`);

export const updateCommentDeletedMutation = gql(`
  mutation UpdateCommentDeleted($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        _id
        deleted
      }
    }
  }
`);
