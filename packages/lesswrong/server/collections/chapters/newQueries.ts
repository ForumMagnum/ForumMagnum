import schema from "@/lib/collections/chapters/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ChaptersViews } from "@/lib/collections/chapters/views";

export const graphqlChapterQueryTypeDefs = gql`
  type Chapter ${ getAllGraphQLFields(schema) }
  
  input SingleChapterInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleChapterOutput {
    result: Chapter
  }
  
  input ChapterViewInput {
    sequenceId: String
   }
  
  input ChapterSelector  {
    default: ChapterViewInput
    SequenceChapters: ChapterViewInput
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
    chapter(
      input: SingleChapterInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleChapterOutput
    chapters(
      input: MultiChapterInput @deprecated(reason: "Use the selector field instead"),
      selector: ChapterSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiChapterOutput
  }
`;
export const chapterGqlQueryHandlers = getDefaultResolvers('Chapters', ChaptersViews);
export const chapterGqlFieldResolvers = getFieldGqlResolvers('Chapters', schema);
