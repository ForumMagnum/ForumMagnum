import schema from "@/lib/collections/userTagRels/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserTagRelQueryTypeDefs = gql`
  type UserTagRel ${
    getAllGraphQLFields(schema)
  }

  input SingleUserTagRelInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleUserTagRelOutput {
    result: UserTagRel
  }

  input MultiUserTagRelInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserTagRelOutput {
    results: [UserTagRel]
    totalCount: Int
  }

  extend type Query {
    userTagRel(input: SingleUserTagRelInput): SingleUserTagRelOutput
    userTagRels(input: MultiUserTagRelInput): MultiUserTagRelOutput
  }
`;

export const userTagRelGqlQueryHandlers = getDefaultResolvers('UserTagRels');
export const userTagRelGqlFieldResolvers = getFieldGqlResolvers('UserTagRels', schema);
