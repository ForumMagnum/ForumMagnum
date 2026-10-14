/** @jest-environment jsdom */

import React, { createContext, useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
// Exercise Apollo's client lifecycle without the app's SSR environment.
// eslint-disable-next-line no-restricted-imports
import { ApolloProvider, useQuery } from '@apollo/client/react';
import { Observable, type Subscriber } from 'rxjs';
import ModerationInbox from '@/components/sunshineDashboard/supermod/ModerationInbox';
import type InboxList from '@/components/sunshineDashboard/supermod/ModerationInboxList';
import type UserKeyboard from '@/components/sunshineDashboard/supermod/ModerationUserKeyboardHandler';
import type Tabs from '@/components/sunshineDashboard/supermod/ModerationTabs';
import type UndoHistory from '@/components/sunshineDashboard/supermod/ModerationUndoHistory';
import { ModerationInboxQueueQueryDocument, ModerationInboxCurationQueryDocument, type ModerationInboxQueueQueryQuery, type ModerationInboxCurationQueryQuery } from '@/lib/generated/gql-codegen/graphql';
import type { UndoHistoryItem } from '@/components/sunshineDashboard/supermod/inboxReducer';

const mockFlash = jest.fn();
const mockNavigate = jest.fn();
const mockLifecycle = { mounts: 0, unmounts: 0 };
let mockUndoQueue: UndoHistoryItem[] = [];

// Keep the actual component, reducer, query documents, Apollo cache, and hooks.
// Replace presentation and unrelated subscriptions with small observable controls.
jest.mock('@/lib/crud/useQuery', () => ({ useQuery }));
jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: () => ({}), useStyles: () => ({}) }));
jest.mock('@/components/common/withUser', () => ({ useCurrentUser: () => ({ _id: 'mod', isAdmin: true }) }));
jest.mock('@/components/common/withMessages', () => ({ useMessages: () => ({ flash: mockFlash }) }));
jest.mock('@/lib/routeUtil', () => ({ useLocation: () => ({ query: {}, location: {} }), useNavigate: () => mockNavigate }));
jest.mock('@/components/hooks/useModeratedUserContents', () => ({ useModeratedUserContents: () => ({ posts: [], comments: [] }) }));
jest.mock('@/components/hooks/useHydrateModerationPostCache', () => ({ useHydrateModerationPostCache: () => {} }));
jest.mock('@/components/tagging/useCoreTags', () => ({ useCoreTags: () => {} }));
jest.mock('@/components/tagging/CoreTagsKeyboardContext', () => ({ CoreTagsKeyboardProvider: ({ children }: React.PropsWithChildren) => children }));
jest.mock('@/components/common/ErrorMessage', () => ({ __esModule: true, default: ({ message }: { message: string }) => <div role="alert">{message}</div> }));
jest.mock('@/lib/vendor/@material-ui/core/src/Button', () => ({ __esModule: true, default: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} /> }));
jest.mock('@/components/vulcan-core/Loading', () => ({ __esModule: true, default: () => <div>Initial loading</div> }));
jest.mock('@/components/sunshineDashboard/supermod/ModerationUserDetailView', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/supermod/ModerationPostKeyboardHandler', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/supermod/ModerationPostSidebar', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/supermod/CurationView', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/supermod/CurationKeyboardHandler', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/supermod/ModerationTabs', () => ({
  __esModule: true, default: ({ onTabChange }: React.ComponentProps<typeof Tabs>) => <button onClick={() => onTabChange('newContent')}>New content</button>,
}));
jest.mock('@/components/sunshineDashboard/supermod/ModerationInboxList', () => ({
  __esModule: true, default: ({ userGroups, onLoadUnloaded, loadingUnloaded }: React.ComponentProps<typeof InboxList>) => <div>
    <div data-testid="queue">{userGroups.flatMap(([, users]) => users.map(user => user._id)).join(',')}</div>
    <button disabled={loadingUnloaded} onClick={onLoadUnloaded}>Load remaining</button>
  </div>,
}));
jest.mock('@/components/sunshineDashboard/supermod/ModerationUserKeyboardHandler', () => ({
  __esModule: true, default: ({ selectedUser, addToUndoQueue }: React.ComponentProps<typeof UserKeyboard>) => <div>
    <div data-testid="selected">{selectedUser?._id}</div>
    <button onClick={() => addToUndoQueue('Approve', async () => {})}>Hold approval</button>
  </div>,
}));
jest.mock('@/components/sunshineDashboard/supermod/ModerationUndoHistory', () => ({
  __esModule: true, default: ({ undoQueue }: React.ComponentProps<typeof UndoHistory>) => {
    mockUndoQueue = undoQueue;
    return <div data-testid="undo">{undoQueue.length}</div>;
  },
}));
jest.mock('@/components/sunshineDashboard/supermod/useConcurrentModeratorChanges', () => ({
  ConcurrentModeratorChangesContext: createContext({}),
  useConcurrentModeratorChanges: () => {
    useEffect(() => { mockLifecycle.mounts++; return () => { mockLifecycle.unmounts++; }; }, []);
    return {};
  },
}));

function user(id: string): SunshineUsersList {
  return {
    __typename: 'User', _id: id, slug: id, username: id, displayName: id, createdAt: '2026-01-01',
    karma: 1, afKarma: 0, deleted: false, isAdmin: false, htmlBio: '', profileImageId: null, website: null,
    postCount: 0, commentCount: 1, maxPostCount: 0, maxCommentCount: 1, sequenceCount: 0, afPostCount: 0,
    afCommentCount: 0, tagRevisionCount: 0, email: null, emails: null, mailgunValidation: null, shortformFeedId: null,
    voteCount: 0, smallUpvoteCount: 0, bigUpvoteCount: 0, smallDownvoteCount: 0, bigDownvoteCount: 0,
    banned: null, reviewedByUserId: null, reviewedAt: null, signUpReCaptchaRating: null, mapLocation: null,
    mapMarkerText: null, htmlMapMarkerText: null, needsReview: true, sunshineNotes: null, sunshineFlagged: false,
    postingDisabled: false, allCommentingDisabled: false, commentingOnOtherUsersDisabled: false,
    conversationsDisabled: false, votingDisabled: false, snoozedUntilContentCount: null, nullifyVotes: false,
    deleteContent: false, moderatorActions: [], reviewGroup: 'newContent', pendingPostCount: 0, pendingCommentCount: 1,
    oldestPendingContentAt: `2026-01-0${id.slice(1)}`, usersContactedBeforeReview: [], voteReceivedCount: 0,
    smallUpvoteReceivedCount: 0, bigUpvoteReceivedCount: 0, smallDownvoteReceivedCount: 0, bigDownvoteReceivedCount: 0,
    recentKarmaInfo: null, lastNotificationsCheck: null, lastRemovedFromReviewQueueAt: null, rejectedContentCount: 0, userRateLimits: [],
  };
}

function queueData(ids = ['u1', 'u2']): ModerationInboxQueueQueryQuery {
  return {
    __typename: 'Query', supermodQueueSnapshotTime: '2026-10-14T12:00:00.000Z',
    users: { __typename: 'MultiUserOutput', results: ids.map(user) },
    reviewQueueUsers: { __typename: 'MultiUserOutput', results: ['u1', 'u2', 'u3'].map(user) },
    posts: { __typename: 'MultiPostOutput', results: [], totalCount: 0 },
    classifiedPosts: { __typename: 'MultiPostOutput', results: [], totalCount: 0 },
  };
}
const curationData: ModerationInboxCurationQueryQuery = {
  __typename: 'Query', CurationCandidatePosts: { __typename: 'CurationCandidatePostsResult', results: [] },
  LastCuratedDate: { __typename: 'LastCuratedDateResult', lastCuratedDate: null },
};
interface Request {
  name: string;
  userLimit?: number;
  observer: Subscriber<ApolloLink.Result>;
}
function setup(cached = false) {
  const requests: Request[] = [];
  const cache = new InMemoryCache();
  if (cached) {
    cache.writeQuery({ query: ModerationInboxQueueQueryDocument, variables: { userLimit: 200, postLimit: 100, reviewQueueLimit: 1000 }, data: queueData() });
    cache.writeQuery({ query: ModerationInboxCurationQueryDocument, data: curationData });
  }
  const client = new ApolloClient({ cache, link: new ApolloLink(operation => new Observable(observer => {
    if (!operation.operationName) throw new Error('Expected a named moderation query');
    requests.push({ name: operation.operationName, userLimit: operation.variables.userLimit, observer });
  })) });
  render(<ApolloProvider client={client}><ModerationInbox /></ApolloProvider>);
  return { client, requests };
}
async function respond(request: Request, result: ApolloLink.Result | Error) {
  await act(async () => {
    if (result instanceof Error) request.observer.error(result);
    else { request.observer.next(result); request.observer.complete(); }
  });
}
function holdApproval() {
  fireEvent.click(screen.getByText('New content'));
  fireEvent.click(screen.getByText('Hold approval'));
  expect(screen.getByTestId('undo').textContent).toBe('1');
  expect(screen.getByTestId('selected').textContent).toBe('u2');
}
function expectRetainedInbox() {
  expect(screen.getByTestId('undo').textContent).toBe('1');
  expect(screen.getByTestId('selected').textContent).toBe('u2');
  expect(mockLifecycle).toEqual({ mounts: 1, unmounts: 0 });
}
function partialFailure(request: Request): ApolloLink.Result {
  return {
    data: request.name === 'ModerationInboxQueueQuery'
      ? { ...queueData(), users: null }
      : { ...curationData, CurationCandidatePosts: null },
    errors: [{ message: `${request.name} failed` }],
  };
}

describe('moderation inbox loading', () => {
  beforeEach(() => { mockFlash.mockClear(); mockLifecycle.mounts = 0; mockLifecycle.unmounts = 0; mockUndoQueue = []; });
  afterEach(() => { mockUndoQueue.forEach(item => clearTimeout(item.timeoutId)); cleanup(); });

  it.each(['network', 'GraphQL'])('retains undo and selection when both cached refreshes fail with %s errors', async kind => {
    const { client, requests } = setup(true);
    await waitFor(() => expect(requests).toHaveLength(2));
    holdApproval();
    for (const request of requests) {
      await respond(request, kind === 'network' ? new Error(`${request.name} failed`) : partialFailure(request));
      expectRetainedInbox();
    }
    expect(mockFlash).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', messageString: expect.stringContaining('Failed to refresh moderation inbox') }));
    client.stop();
  });

  it('starts both queries together and retries initial errors without initializing a partial inbox', async () => {
    const { client, requests } = setup();
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests.map(request => request.name).sort()).toEqual(['ModerationInboxCurationQuery', 'ModerationInboxQueueQuery']);
    for (const request of requests) await respond(request, partialFailure(request));
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(mockLifecycle.mounts).toBe(0);
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(requests).toHaveLength(4));
    for (const request of requests.slice(2)) await respond(request, { data: request.name === 'ModerationInboxQueueQuery' ? queueData() : curationData });
    await waitFor(() => expect(mockLifecycle.mounts).toBe(1));
    holdApproval();
    client.stop();
  });

  it('keeps bulk loading retryable and preserves existing moderation state', async () => {
    const { client, requests } = setup(true);
    await waitFor(() => expect(requests).toHaveLength(2));
    for (const request of requests) await respond(request, { data: request.name === 'ModerationInboxQueueQuery' ? queueData() : curationData });
    holdApproval();
    fireEvent.click(screen.getByText('Load remaining'));
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2].userLimit).toBe(1000);
    await respond(requests[2], new Error('Bulk request failed'));
    expectRetainedInbox();
    fireEvent.click(screen.getByText('Load remaining'));
    await waitFor(() => expect(requests).toHaveLength(4));
    await respond(requests[3], { data: queueData(['u1', 'u2', 'u3']) });
    expectRetainedInbox();
    expect(screen.getByTestId('queue').textContent).toBe('u2,u3');
    expect(requests.filter(request => request.name === 'ModerationInboxCurationQuery')).toHaveLength(1);
    client.stop();
  });
});
