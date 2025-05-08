import schema from "@/lib/collections/digestPosts/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlDigestPostQueryTypeDefs = gql`
  type DigestPost ${ getAllGraphQLFields(schema) }
  
  input SingleDigestPostInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleDigestPostOutput {
    result: DigestPost
  }
  
  input DigestPostViewInput
  
  input DigestPostSelector @oneOf {
    default: DigestPostViewInput
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
    digestPost(
      input: SingleDigestPostInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleDigestPostOutput
    digestPosts(
      input: MultiDigestPostInput @deprecated(reason: "Use the selector field instead"),
      selector: DigestPostSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiDigestPostOutput
  }
`;
export const digestPostGqlQueryHandlers = getDefaultResolvers('DigestPosts', new CollectionViewSet('DigestPosts', {}));
export const digestPostGqlFieldResolvers = getFieldGqlResolvers('DigestPosts', schema);
