import { searchHistoryGqlMutations } from '../server/resolvers/searchHistoryResolvers';

function makeContext(currentUser: {_id: string} | null) {
  return {
    currentUser,
    repos: {users: {recordSearch: jest.fn().mockResolvedValue(['query'])}},
    Users: {rawUpdateOne: jest.fn().mockResolvedValue(undefined)},
    loaders: {Users: {clear: jest.fn()}},
  };
}

it('rejects anonymous history writes and clears before touching storage', async () => {
  const context = makeContext(null);
  await expect(searchHistoryGqlMutations.recordSearch(undefined, {query: 'private'}, context)).rejects.toThrow('logged in');
  await expect(searchHistoryGqlMutations.clearSearchHistory(undefined, {}, context)).rejects.toThrow('logged in');
  expect(context.repos.users.recordSearch).not.toHaveBeenCalled();
  expect(context.Users.rawUpdateOne).not.toHaveBeenCalled();
});

it('trims queries and only writes to the authenticated user, then invalidates their loader', async () => {
  const context = makeContext({_id: 'owner'});
  await expect(searchHistoryGqlMutations.recordSearch(undefined, {query: '  query  '}, context)).resolves.toEqual(['query']);
  expect(context.repos.users.recordSearch).toHaveBeenCalledWith('owner', 'query');
  expect(context.loaders.Users.clear).toHaveBeenCalledWith('owner');
});

it.each(['   ', 'x'.repeat(1001)])('rejects blank and oversized queries', async (query) => {
  const context = makeContext({_id: 'owner'});
  await expect(searchHistoryGqlMutations.recordSearch(undefined, {query}, context)).rejects.toThrow('between 1 and 1000');
  expect(context.repos.users.recordSearch).not.toHaveBeenCalled();
});

it('clears only the authenticated user history and invalidates their loader', async () => {
  const context = makeContext({_id: 'owner'});
  await expect(searchHistoryGqlMutations.clearSearchHistory(undefined, {}, context)).resolves.toBe(true);
  expect(context.Users.rawUpdateOne).toHaveBeenCalledWith({_id: 'owner'}, {$set: {searchHistory: []}});
  expect(context.loaders.Users.clear).toHaveBeenCalledWith('owner');
});
