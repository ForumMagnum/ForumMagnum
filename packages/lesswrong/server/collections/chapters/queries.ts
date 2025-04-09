import schema from "@/lib/collections/chapters/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlChapterQueryTypeDefs = gql`
  type Chapter ${
    getAllGraphQLFields(schema)
  }

  input SingleChapterInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleChapterOutput {
    result: Chapter
  }

  input MultiChapterInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiChapterOutput {
    results: [Chapter]
    totalCount: Int
  }

  extend type Query {
    chapter(input: SingleChapterInput): SingleChapterOutput
    chapters(input: MultiChapterInput): MultiChapterOutput
  }
`;

export const chapterGqlQueryHandlers = getDefaultResolvers('Chapters');
export const chapterGqlFieldResolvers = getFieldGqlResolvers('Chapters', schema);
