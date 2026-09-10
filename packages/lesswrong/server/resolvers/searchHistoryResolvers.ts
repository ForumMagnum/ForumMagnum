import gql from "graphql-tag";

interface SearchHistoryContext {
  currentUser: Pick<DbUser, '_id'> | null;
  repos: {users: Pick<ResolverContext['repos']['users'], 'recordSearch'>};
  Users: Pick<ResolverContext['Users'], 'rawUpdateOne'>;
  loaders: {Users: Pick<ResolverContext['loaders']['Users'], 'clear'>};
}

export const searchHistoryGqlTypeDefs = gql`
  extend type Mutation {
    recordSearch(query: String!): [String!]!
    clearSearchHistory: Boolean!
  }
`;

export const searchHistoryGqlMutations = {
  async recordSearch(_: void, {query}: {query: string}, context: SearchHistoryContext): Promise<string[]> {
    const {currentUser} = context;
    if (!currentUser) throw new Error("You must be logged in to save search history");
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length > 1000) {
      throw new Error("Search queries must contain between 1 and 1000 characters");
    }
    const history = await context.repos.users.recordSearch(currentUser._id, trimmedQuery);
    context.loaders.Users.clear(currentUser._id);
    return history;
  },
  async clearSearchHistory(_: void, args: Record<string, never>, context: SearchHistoryContext): Promise<boolean> {
    const {currentUser} = context;
    if (!currentUser) throw new Error("You must be logged in to clear search history");
    // This private bookkeeping must not produce profile-change logs.
    await context.Users.rawUpdateOne({_id: currentUser._id}, {$set: {searchHistory: []}});
    context.loaders.Users.clear(currentUser._id);
    return true;
  },
};
