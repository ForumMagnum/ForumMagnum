import schema from "@/lib/collections/digests/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlDigestQueryTypeDefs = gql`
  type Digest {
    ${getAllGraphQLFields(schema)}
  }

  input SingleDigestInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleDigestOutput {
    result: Digest
  }

  input MultiDigestInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiDigestOutput {
    results: [Digest]
    totalCount: Int
  }

  extend type Query {
    digest(input: SingleDigestInput): SingleDigestOutput
    digests(input: MultiDigestInput): MultiDigestOutput
  }
`;

export const digestGqlQueryHandlers = getDefaultResolvers('Digests');
export const digestGqlFieldResolvers = getFieldGqlResolvers('Digests', schema);
