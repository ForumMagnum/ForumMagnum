import schema from "@/lib/collections/tagFlags/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlTagFlagQueryTypeDefs = gql`
  type TagFlag {
    ${getAllGraphQLFields(schema)}
  }

  input SingleTagFlagInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleTagFlagOutput {
    result: TagFlag
  }

  input MultiTagFlagInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiTagFlagOutput {
    results: [TagFlag]
    totalCount: Int
  }

  extend type Query {
    tagFlag(input: SingleTagFlagInput): SingleTagFlagOutput
    tagFlags(input: MultiTagFlagInput): MultiTagFlagOutput
  }
`;

export const tagFlagGqlQueryHandlers = getDefaultResolvers('TagFlags');
export const tagFlagGqlFieldResolvers = getFieldGqlResolvers('TagFlags', schema);
