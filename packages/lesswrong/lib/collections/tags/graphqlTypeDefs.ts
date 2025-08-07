import gql from "graphql-tag";


export const graphqlTypeDefs = gql`
  type TagContributor {
    user: User
    contributionScore: Int!
    currentAttributionCharCount: Int
    numCommits: Int!
    voteCount: Int!
  }
  type TagContributorsList {
    contributors: [TagContributor!]!
    totalCount: Int!
  }
  type UserLikingTag {
    _id: String!
    displayName: String!
  }
`;
