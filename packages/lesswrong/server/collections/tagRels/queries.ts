import schema from "@/lib/collections/tagRels/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlTagRelQueryTypeDefs = gql`
  type TagRel ${
    getAllGraphQLFields(schema)
  }

  input SingleTagRelInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleTagRelOutput {
    result: TagRel
  }

  input MultiTagRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiTagRelOutput {
    results: [TagRel]
    totalCount: Int
  }

  extend type Query {
    tagRel(input: SingleTagRelInput): SingleTagRelOutput
    tagRels(input: MultiTagRelInput): MultiTagRelOutput
  }
`;

export const tagRelGqlQueryHandlers = getDefaultResolvers('TagRels');
export const tagRelGqlFieldResolvers = getFieldGqlResolvers('TagRels', schema);
