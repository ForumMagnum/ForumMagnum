import gql from "graphql-tag";


export const graphqlTypeDefs = gql`
  type LatLng {
    lat: Float!
    lng: Float!
  }

  input ExpandedFrontpageSectionsSettingsInput {
    community: Boolean
    recommendations: Boolean
    quickTakes: Boolean
    quickTakesCommunity: Boolean
    popularComments: Boolean
  }

  type ExpandedFrontpageSectionsSettingsOutput {
    community: Boolean
    recommendations: Boolean
    quickTakes: Boolean
    quickTakesCommunity: Boolean
    popularComments: Boolean
  }

  input PartiallyReadSequenceItemInput {
    sequenceId: String
    collectionId: String
    lastReadPostId: String!
    nextPostId: String!
    numRead: Int!
    numTotal: Int!
    lastReadTime: Date
  }

  type PartiallyReadSequenceItemOutput {
    sequenceId: String
    collectionId: String
    lastReadPostId: String
    nextPostId: String
    numRead: Int
    numTotal: Int
    lastReadTime: Date
  }

  input PostMetadataInput {
    postId: String!
  }

  type PostMetadataOutput {
    postId: String!
  }

  input RecommendationAlgorithmSettingsInput {
    method: String!
    count: Int!
    scoreOffset: Float!
    scoreExponent: Float!
    personalBlogpostModifier: Float!
    frontpageModifier: Float!
    curatedModifier: Float!
    onlyUnread: Boolean!
  }

  input RecommendationSettingsInput {
    frontpage: RecommendationAlgorithmSettingsInput!
    frontpageEA: RecommendationAlgorithmSettingsInput!
    recommendationspage: RecommendationAlgorithmSettingsInput!
  }
`;
