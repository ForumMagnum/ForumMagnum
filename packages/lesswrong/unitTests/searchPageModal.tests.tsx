/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SearchPage from '../components/search/SearchPage';

const mockNavigate = jest.fn();
const mockLocation = {pathname: '/posts/example', search: '?context=keep-me', hash: '#comment'};
jest.mock('@/lib/routeUtil', () => ({
  useNavigate: () => mockNavigate,
  useSubscribedLocation: () => ({location: mockLocation, query: {context: 'keep-me', query: 'unrelated'}}),
}));
jest.mock('next/navigation', () => ({usePathname: () => '/posts/example'}));
jest.mock('@/components/hooks/useStyles', () => ({useStyles: () => ({}), defineStyles: () => ({})}));
jest.mock('@/components/hooks/defineStyles', () => ({defineStyles: () => ({})}));
let wideScreen = true;
jest.mock('@/components/hooks/useScreenWidth', () => ({useIsAboveBreakpoint: () => wideScreen}));
jest.mock('@/lib/utils/componentsWithChildren', () => ({InstantSearch: ({children}: {children: React.ReactNode}) => <>{children}</>}));
jest.mock('@/lib/instanceSettings', () => ({searchOriginDate: '2003-01-01T01:00:00Z'}));
jest.mock('@/lib/search/searchUtil', () => ({collectionIsSearchIndexed: () => true, isSearchEnabled: () => true, getSearchClient: jest.fn(), getSearchIndexName: (name: string) => name}));
jest.mock('../components/common/withUser', () => ({useCurrentUser: () => null}));
jest.mock('../components/common/ForumIcon', () => ({__esModule: true, default: () => null}));
jest.mock('../components/common/LWTooltip', () => ({__esModule: true, default: ({children}: {children: React.ReactNode}) => <>{children}</>}));
jest.mock('../components/common/ErrorBoundary', () => ({__esModule: true, default: ({children}: {children: React.ReactNode}) => <>{children}</>}));
jest.mock('../components/search/useSearchAnalytics', () => ({useSearchAnalytics: () => jest.fn(), useCaptureSearchResultSelected: () => jest.fn()}));
jest.mock('../components/search/useSearchHistory', () => ({useSearchHistory: () => ({resetNavigation: jest.fn(), recordSearch: jest.fn()})}));
jest.mock('../components/search/useSearchResults', () => ({useSearchResults: () => ({hits: [], total: 0, hasMore: false, loading: false})}));
jest.mock('../components/search/SearchWikitagsBar', () => ({__esModule: true, default: () => null}));
jest.mock('../components/search/UsersSearchAutoComplete', () => ({__esModule: true, default: ({clickAction}: {clickAction: (id: string) => void}) => <>
  <button type="button" onClick={() => clickAction('alice')}>Select Alice</button>
  <button type="button" onClick={() => clickAction('bob')}>Select Bob</button>
</>}));
jest.mock('../components/form-components/SingleUsersItem', () => ({__esModule: true, default: ({userId, removeItem}: {userId: string, removeItem: (id: string) => void}) =>
  <button type="button" onClick={() => removeItem(userId)}>Remove {userId}</button>,
}));
jest.mock('../components/search/ExpandedUsersSearchHit', () => ({__esModule: true, default: () => null}));
jest.mock('../components/search/ExpandedPostsSearchHit', () => ({__esModule: true, default: () => null}));
jest.mock('../components/search/ExpandedCommentsSearchHit', () => ({__esModule: true, default: () => null}));
jest.mock('../components/search/ExpandedTagsSearchHit', () => ({__esModule: true, default: () => null}));
jest.mock('../components/search/ExpandedSequencesSearchHit', () => ({__esModule: true, default: () => null}));

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  wideScreen = true;
});

it('keeps modal searches separate from the underlying page URL', () => {
  render(<SearchPage presentation="modal" onClose={jest.fn()} />);
  const input = screen.getByRole('searchbox');
  expect(input.getAttribute('value')).toBe('');
  fireEvent.change(input, {target: {value: 'alignment'}});
  fireEvent.click(screen.getByRole('checkbox', {name: 'Post'}));
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(input.getAttribute('value')).toBe('alignment');
});

it('still synchronizes full-page searches to the URL', () => {
  render(<SearchPage />);
  fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'alignment'}});
  expect(mockNavigate).toHaveBeenLastCalledWith(expect.objectContaining({search: expect.stringContaining('query=alignment')}), {replace: true, skipRouter: true});
});

it('toggles mobile filters and offers an explicit close control', () => {
  const onClose = jest.fn();
  render(<SearchPage presentation="modal" onClose={onClose} />);
  const toggle = screen.getByRole('button', {name: 'Filters'});
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', {name: 'Close search'}));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('closes after a result link handles navigation even when it stops propagation', async () => {
  const onClose = jest.fn();
  render(<SearchPage presentation="modal" onClose={onClose} />);
  const link = document.createElement('a');
  link.href = '/posts/example#comment';
  const navigate = jest.fn(event => {
    event.preventDefault();
    event.stopPropagation();
  });
  link.addEventListener('click', navigate);
  screen.getByRole('group', {name: 'Search results'}).append(link);
  fireEvent.click(link);
  expect(navigate).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it('starts with Authors expanded directly below Timeframe and other sections collapsed', () => {
  render(<SearchPage presentation="modal" />);
  const toggles = screen.getByRole('complementary', {name: 'Search options'}).querySelectorAll('button[aria-expanded]');
  expect(toggles.length).toBe(6);
  expect(toggles[0].textContent).toContain('Timeframe');
  expect(toggles[1].textContent).toContain('Author');
  for (const [index, toggle] of toggles.entries()) {
    expect(toggle.getAttribute('aria-expanded')).toBe(index === 1 ? 'true' : 'false');
  }
});

it('opens timeframe in a separate bar above the search layout and retains its selection when closed', () => {
  render(<SearchPage presentation="modal" />);
  const toggle = screen.getByRole('button', {name: /Timeframe/});
  fireEvent.click(toggle);
  const panel = screen.getByRole('region', {name: 'Timeframe'});
  expect(panel.id).toBe(toggle.getAttribute('aria-controls'));
  expect(panel.contains(screen.getByLabelText('From date'))).toBe(true);
  expect(panel.compareDocumentPosition(screen.getByRole('search')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.change(screen.getByLabelText('From date'), {target: {value: '2020-01-01'}});
  fireEvent.click(screen.getByRole('button', {name: 'Done with timeframe'}));
  expect(screen.queryByRole('region', {name: 'Timeframe'})).toBeNull();
  expect(toggle.textContent).toContain('2020-01-01');
  fireEvent.click(toggle);
  expect(screen.getByLabelText('From date').getAttribute('value')).toBe('2020-01-01');
});

it('keeps the modal timeframe mounted in the slot above the dialog and reveals it on demand', () => {
  const slot = document.createElement('div');
  document.body.append(slot);
  render(<SearchPage presentation="modal" timeframeSlot={slot} />);
  const toggle = screen.getByRole('button', {name: /Timeframe/});
  const section = slot.querySelector('section')!;
  expect(section.id).toBe(toggle.getAttribute('aria-controls'));
  expect(section.hasAttribute('inert')).toBe(true);
  expect(screen.queryByRole('region', {name: 'Timeframe'})).toBeNull();
  fireEvent.click(toggle);
  expect(screen.getByRole('region', {name: 'Timeframe'})).toBe(section);
  expect(section.hasAttribute('inert')).toBe(false);
  fireEvent.click(screen.getByRole('button', {name: 'Done with timeframe'}));
  expect(slot.querySelector('section')).toBe(section);
  expect(section.hasAttribute('inert')).toBe(true);
  expect(screen.queryByRole('region', {name: 'Timeframe'})).toBeNull();
  expect(document.activeElement).toBe(toggle);
  slot.remove();
});

it('keeps the timeframe inside mobile filters even when the modal offers a slot', () => {
  wideScreen = false;
  const slot = document.createElement('div');
  document.body.append(slot);
  render(<SearchPage presentation="modal" timeframeSlot={slot} />);
  expect(slot.childElementCount).toBe(0);
  fireEvent.click(screen.getByRole('button', {name: /Timeframe/}));
  const panel = screen.getByRole('region', {name: 'Timeframe'});
  expect(slot.contains(panel)).toBe(false);
  expect(screen.getByRole('complementary', {name: 'Search options'}).contains(panel)).toBe(true);
  expect(panel.compareDocumentPosition(screen.getByRole('button', {name: /Author/})) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name: 'Done with timeframe'}));
  expect(screen.queryByRole('region', {name: 'Timeframe'})).toBeNull();
  expect(slot.childElementCount).toBe(0);
  slot.remove();
});

it('selects one content kind on click and adds another only after holding', async () => {
  jest.useFakeTimers();
  try {
    render(<SearchPage presentation="modal" />);
    const post = screen.getByRole('checkbox', {name: 'Post'});
    const user = screen.getByRole('checkbox', {name: 'User'});
    fireEvent.click(post);
    fireEvent.click(user);
    expect(post.getAttribute('aria-checked')).toBe('false');
    expect(user.getAttribute('aria-checked')).toBe('true');
    fireEvent(post, new MouseEvent('pointerdown', {bubbles: true, button: 0}));
    await act(() => jest.advanceTimersByTime(499));
    expect(post.getAttribute('aria-checked')).toBe('false');
    await act(() => jest.advanceTimersByTime(1));
    expect(post.getAttribute('aria-checked')).toBe('true');
    fireEvent.pointerUp(post);
    fireEvent.click(post);
    expect(user.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(post);
    expect(user.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('checkbox', {name: 'All'}));
    expect(post.getAttribute('aria-checked')).toBe('false');
  } finally {
    jest.useRealTimers();
  }
});

it('cancels interrupted holds and supports holding Space to add a kind', async () => {
  jest.useFakeTimers();
  try {
    const {unmount} = render(<SearchPage presentation="modal" />);
    const post = screen.getByRole('checkbox', {name: 'Post'});
    const user = screen.getByRole('checkbox', {name: 'User'});
    fireEvent.click(user);
    for (const cancel of [fireEvent.pointerLeave, fireEvent.pointerCancel, fireEvent.blur]) {
      fireEvent(post, new MouseEvent('pointerdown', {bubbles: true, button: 0}));
      cancel(post);
      await act(() => jest.advanceTimersByTime(500));
      expect(post.getAttribute('aria-checked')).toBe('false');
    }
    fireEvent.keyDown(post, {key: ' '});
    await act(() => jest.advanceTimersByTime(500));
    fireEvent.keyUp(post, {key: ' '});
    expect(post.getAttribute('aria-checked')).toBe('true');
    expect(user.getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(post, {key: 'Enter'});
    fireEvent.keyUp(post, {key: 'Enter'});
    expect(user.getAttribute('aria-checked')).toBe('false');
    fireEvent(post, new MouseEvent('pointerdown', {bubbles: true, button: 0}));
    unmount();
    await act(() => jest.advanceTimersByTime(500));
  } finally {
    jest.useRealTimers();
  }
});

it('restores the last modal query and filters after unmounting', () => {
  const {unmount} = render(<SearchPage presentation="modal" />);
  fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'alignment'}});
  fireEvent.click(screen.getByRole('checkbox', {name: 'Post'}));
  fireEvent.click(screen.getByRole('button', {name: /Timeframe/}));
  fireEvent.change(screen.getByLabelText('From date'), {target: {value: '2020-01-01'}});
  unmount();

  render(<SearchPage presentation="modal" />);
  expect(screen.getByRole('searchbox').getAttribute('value')).toBe('alignment');
  expect(screen.getByRole('checkbox', {name: 'Post'}).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('button', {name: /Timeframe/}).textContent).toContain('2020-01-01');
  expect(mockNavigate).not.toHaveBeenCalled();
});

it('persists clearing filters without clearing the query', () => {
  const {unmount} = render(<SearchPage presentation="modal" />);
  fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'alignment'}});
  fireEvent.click(screen.getByRole('checkbox', {name: 'Post'}));
  fireEvent.click(screen.getAllByRole('button', {name: 'Clear filters'})[0]);
  unmount();

  render(<SearchPage presentation="modal" />);
  expect(screen.getByRole('searchbox').getAttribute('value')).toBe('alignment');
  expect(screen.getByRole('checkbox', {name: 'All'}).getAttribute('aria-checked')).toBe('true');
  expect(screen.queryByRole('button', {name: 'Clear filters'})).toBeNull();
});

it('keeps author pills at the end of the search field synchronized with the author filter', () => {
  const {unmount} = render(<SearchPage presentation="modal" />);
  const input = screen.getByRole('searchbox');
  fireEvent.change(input, {target: {value: 'alignment'}});
  fireEvent.click(screen.getByRole('button', {name: 'Select Alice'}));
  fireEvent.click(screen.getByRole('button', {name: 'Select Bob'}));
  const field = within(input.parentElement!);
  const authors = within(screen.getByRole('group', {name: 'Author'}));
  const alice = field.getByRole('button', {name: 'Remove alice'});
  expect(input.compareDocumentPosition(alice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(alice);
  expect(authors.queryByRole('button', {name: 'Remove alice'})).toBeNull();
  expect(field.queryByRole('button', {name: 'Remove alice'})).toBeNull();
  expect(authors.getByRole('button', {name: 'Remove bob'})).toBeTruthy();
  expect(document.activeElement).toBe(input);
  fireEvent.click(authors.getByRole('button', {name: 'Remove bob'}));
  expect(field.queryByRole('button', {name: 'Remove bob'})).toBeNull();
  expect(input.getAttribute('value')).toBe('alignment');
  fireEvent.click(screen.getByRole('button', {name: 'Select Bob'}));
  unmount();
  render(<SearchPage presentation="modal" />);
  const restoredField = within(screen.getByRole('searchbox').parentElement!);
  expect(restoredField.queryByRole('button', {name: 'Remove alice'})).toBeNull();
  expect(restoredField.getByRole('button', {name: 'Remove bob'})).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', {name: 'Clear filters'})[0]);
  expect(restoredField.queryByRole('button', {name: 'Remove bob'})).toBeNull();
});
