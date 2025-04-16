import schema from "@/lib/collections/tags/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlTagQueryTypeDefs = gql`
  type Tag {
    ${getAllGraphQLFields(schema)}
  }

  input SingleTagInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleTagOutput {
    result: Tag
  }

  input MultiTagInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiTagOutput {
    results: [Tag]
    totalCount: Int
  }

  extend type Query {
    tag(input: SingleTagInput): SingleTagOutput
    tags(input: MultiTagInput): MultiTagOutput
  }
`;

export const tagGqlQueryHandlers = getDefaultResolvers('Tags');
export const tagGqlFieldResolvers = getFieldGqlResolvers('Tags', schema);
