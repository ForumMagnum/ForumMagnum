import schema from "@/lib/collections/digests/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { DigestsViews } from "@/lib/collections/digests/views";

export const graphqlDigestQueryTypeDefs = gql`
  type Digest ${ getAllGraphQLFields(schema) }
  
  input SingleDigestInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleDigestOutput {
    result: Digest
  }
  
  input DigestDefaultViewInput
  
  input DigestsFindByNumInput {
    num: String
  }
  
  input DigestsAllInput
  
  input DigestSelector  {
    default: DigestDefaultViewInput
    findByNum: DigestsFindByNumInput
    all: DigestsAllInput
  }
  
  input MultiDigestInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiDigestOutput {
    results: [Digest]
    totalCount: Int
  }
  
  extend type Query {
    digest(
      input: SingleDigestInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleDigestOutput
    digests(
      input: MultiDigestInput @deprecated(reason: "Use the selector field instead"),
      selector: DigestSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiDigestOutput
  }
`;
export const digestGqlQueryHandlers = getDefaultResolvers('Digests', DigestsViews);
export const digestGqlFieldResolvers = getFieldGqlResolvers('Digests', schema);
