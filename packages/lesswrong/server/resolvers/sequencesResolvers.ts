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

  type LibrarySequencesSearchResult {
    results: [Sequence!]!
  }

  extend type Query {
    getSequenceStats(sequenceId: String!): SequenceStats
    librarySequencesSearch(query: String!, libraryTopics: [String!], curatedOnly: Boolean, sortBy: String, limit: Int): LibrarySequencesSearchResult!
    libraryTopicCounts: [LibraryTopicCount!]!
  }
`;

// Backstop only — the client pages through results by growing its limit
// (useQueryWithLoadMore), so this must stay above any plausible topic size.
const MAX_LIBRARY_SEARCH_RESULTS = 1000;

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
    const limit = Math.min(args.limit ?? 50, MAX_LIBRARY_SEARCH_RESULTS);
    const topics = args.libraryTopics?.length ? args.libraryTopics : null;
    // Topic filtering matches against the derived tags shown as row chips
    // (SequencesRepo.getDerivedTags), so the filter can never disagree with
    // the chips. Fetch all candidates first, then filter and trim.
    const candidates = await context.repos.sequences.searchLibrarySequences({
      query: args.query,
      curatedOnly: !!args.curatedOnly,
      sortBy: args.sortBy ?? null,
      limit: topics ? MAX_LIBRARY_SEARCH_RESULTS : limit,
    });
    let results = candidates;
    if (topics) {
      const derivedTags = await context.repos.sequences.getDerivedTags(candidates.map(sequence => sequence._id));
      results = candidates
        .filter((sequence, index) => derivedTags[index].some(tag => topics.includes(tag.name ?? '')))
        .slice(0, limit);
    }
    return { results: await accessFilterMultiple(context.currentUser, 'Sequences', results, context) };
  },
  libraryTopicCounts: async (root: void, args: {}, context: ResolverContext) => {
    return await context.repos.sequences.libraryTopicCounts();
  },
};
