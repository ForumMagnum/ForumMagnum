import gql from "graphql-tag";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

export const sequencesResolversTypeDefs = gql`
  type SequenceStats {
    totalWordCount: Float
    totalReadTime: Float
  }

  type LibraryTopicCount {
    topic: String!
    count: Int!
  }

  extend type Query {
    getSequenceStats(sequenceId: String!): SequenceStats
    librarySequencesSearch(query: String!, libraryTopics: [String!], curatedOnly: Boolean, sortBy: String, limit: Int): [Sequence!]!
    libraryTopicCounts: [LibraryTopicCount!]!
  }
`;

const MAX_LIBRARY_SEARCH_RESULTS = 50;

interface LibrarySequencesSearchArgs {
  query: string;
  libraryTopics?: string[] | null;
  curatedOnly?: boolean | null;
  sortBy?: string | null;
  limit?: number | null;
}

export const sequencesResolversQueries = {
  getSequenceStats: async (root: void, { sequenceId }: { sequenceId: string }, context: ResolverContext) => {
    return await context.repos.sequences.getSequenceWordCountAndReadTime(sequenceId);
  },
  librarySequencesSearch: async (root: void, args: LibrarySequencesSearchArgs, context: ResolverContext) => {
    const limit = Math.min(args.limit ?? MAX_LIBRARY_SEARCH_RESULTS, MAX_LIBRARY_SEARCH_RESULTS);
    const results = await context.repos.sequences.searchLibrarySequences({
      query: args.query,
      libraryTopics: args.libraryTopics?.length ? args.libraryTopics : null,
      curatedOnly: !!args.curatedOnly,
      sortBy: args.sortBy ?? null,
      limit,
    });
    return await accessFilterMultiple(context.currentUser, 'Sequences', results, context);
  },
  libraryTopicCounts: async (root: void, args: {}, context: ResolverContext) => {
    return await context.repos.sequences.libraryTopicCounts();
  },
};
