import schema from "@/lib/collections/digestPosts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlDigestPostQueryTypeDefs = gql`
  type DigestPost ${
    getAllGraphQLFields(schema)
  }

  input SingleDigestPostInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleDigestPostOutput {
    result: DigestPost
  }

  input MultiDigestPostInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiDigestPostOutput {
    results: [DigestPost]
    totalCount: Int
  }

  extend type Query {
    digestPost(input: SingleDigestPostInput): SingleDigestPostOutput
    digestPosts(input: MultiDigestPostInput): MultiDigestPostOutput
  }
`;

export const digestPostGqlQueryHandlers = getDefaultResolvers('DigestPosts');
export const digestPostGqlFieldResolvers = getFieldGqlResolvers('DigestPosts', schema);
