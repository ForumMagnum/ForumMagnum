import gql from "graphql-tag";


export const graphqlTypeDefs = gql`
  type SocialPreviewType {
    _id: String!
    imageId: String
    imageUrl: String!
    text: String
  }

  input CoauthorStatusInput {
    userId: String!
    confirmed: Boolean!
    requested: Boolean!
  }

  input SocialPreviewInput {
    imageId: String
    text: String
  }

  input CrosspostInput {
    isCrosspost: Boolean!
    hostedHere: Boolean
    foreignPostId: String
  }

  type CoauthorStatusOutput {
    userId: String!
    confirmed: Boolean!
    requested: Boolean!
  }

  type SocialPreviewOutput {
    imageId: String
    text: String
  }

  type CrosspostOutput {
    isCrosspost: Boolean!
    hostedHere: Boolean
    foreignPostId: String
  }
`;
