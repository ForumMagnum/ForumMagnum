import { navigateSearchHistory } from '../components/search/searchHistoryNavigation';

it('recalls newest to oldest, stops at the end, and restores the unfinished query', () => {
  const history = ['newest', 'oldest'];
  const first = navigateSearchHistory(null, history, 'unfinished', 'ArrowUp');
  expect(first.query).toBe('newest');
  const second = navigateSearchHistory(first.navigation, history, first.query, 'ArrowUp');
  expect(second.query).toBe('oldest');
  const end = navigateSearchHistory(second.navigation, history, second.query, 'ArrowUp');
  expect(end.query).toBe('oldest');
  const newer = navigateSearchHistory(end.navigation, history, end.query, 'ArrowDown');
  expect(newer.query).toBe('newest');
  expect(navigateSearchHistory(newer.navigation, history, newer.query, 'ArrowDown'))
    .toEqual({navigation: null, query: 'unfinished'});
});

it('leaves the input alone with no history or down before recall', () => {
  expect(navigateSearchHistory(null, [], 'draft', 'ArrowUp')).toEqual({navigation: null, query: 'draft'});
  expect(navigateSearchHistory(null, ['older'], 'draft', 'ArrowDown')).toEqual({navigation: null, query: 'draft'});
});

it('keeps a stable browsing session when history updates from another request', () => {
  const first = navigateSearchHistory(null, ['first', 'second'], '', 'ArrowUp');
  expect(navigateSearchHistory(first.navigation, ['new', 'first', 'second'], first.query, 'ArrowUp').query)
    .toBe('second');
});

it('starts a fresh browsing session after the recalled query is edited', () => {
  const result = navigateSearchHistory(null, ['previous'], 'edited previous', 'ArrowUp');
  expect(navigateSearchHistory(result.navigation, ['previous'], result.query, 'ArrowDown').query)
    .toBe('edited previous');
});
