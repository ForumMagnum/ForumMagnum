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
  mutation SetHomePageDesignVerified($designId: String!, $verified: Boolean!) {
    setHomePageDesignVerified(designId: $designId, verified: $verified) {
      _id
      verified
    }
  }
`);
