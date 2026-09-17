/** @jest-environment jsdom */

import React, { useEffect } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { Observable, type Subscriber } from 'rxjs';
import { Kind, type DocumentNode, type SelectionSetNode } from 'graphql';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import { useRejectContent } from '@/components/hooks/useRejectContent';

function fixtureFields(document: DocumentNode, selectionSet: SelectionSetNode): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      fields[selection.alias?.value ?? selection.name.value] = null;
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = document.definitions.find(definition => definition.kind === Kind.FRAGMENT_DEFINITION && definition.name.value === selection.name.value);
      if (fragment?.kind === Kind.FRAGMENT_DEFINITION) Object.assign(fields, fixtureFields(document, fragment.selectionSet));
    }
  }
  return fields;
}

function contentFixture(document: DocumentNode, typename: 'Post' | 'Comment') {
  const fragment = document.definitions.find(definition => definition.kind === Kind.FRAGMENT_DEFINITION && definition.name.value === (typename === 'Post' ? 'SunshinePostsList' : 'SunshineCommentsList'));
  if (fragment?.kind !== Kind.FRAGMENT_DEFINITION) throw new Error('Missing content fragment');
  return { ...fixtureFields(document, fragment.selectionSet), __typename: typename, _id: typename.toLowerCase(), rejected: false, rejectedReason: null, title: 'Test content' };
}

function RejectPanel({ content, skipRejectionPM, onReady }: { content: SunshinePostsList | SunshineCommentsList, skipRejectionPM: boolean, onReady: (reject: () => void) => void }) {
  const { rejectContent } = useRejectContent();
  useEffect(() => {
    onReady(() => {
      if (content.__typename === 'Post') {
        void rejectContent({ collectionName: 'Posts', document: content, reason: '<p>Rejected reason</p>', skipRejectionPM });
      } else if (content.__typename === 'Comment') {
        void rejectContent({ collectionName: 'Comments', document: content, reason: '<p>Rejected reason</p>' });
      }
    });
  }, [content, skipRejectionPM, onReady, rejectContent]);
  return null;
}

function PanelHarness({ collectionName, skipRejectionPM, onReady }: { collectionName: 'Posts' | 'Comments', skipRejectionPM: boolean, onReady: (reject: () => void) => void }) {
  const { posts, comments } = useModeratedUserContents('user');
  const content = collectionName === 'Posts' ? posts[0] : comments[0];
  return content && !content.rejected ? <RejectPanel content={content} skipRejectionPM={skipRejectionPM} onReady={onReady} /> : null;
}

describe('moderation rejection reactivity', () => {
  beforeEach(() => Object.assign(globalThis, { bundleIsServer: false }));
  afterEach(() => Object.assign(globalThis, { bundleIsServer: true }));

  it.each([
    { collectionName: 'Posts', skipRejectionPM: false },
    { collectionName: 'Posts', skipRejectionPM: true },
    { collectionName: 'Comments', skipRejectionPM: false },
  ] as const)('updates $collectionName (skipRejectionPM: $skipRejectionPM) before the mutation resolves', async ({ collectionName, skipRejectionPM }) => {
    const mutationVariables: Record<string, unknown>[] = [];
    const mutations: Subscriber<ApolloLink.Result>[] = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(operation => new Observable(observer => {
        if (operation.operationName === 'multiPostusePublishedPostsQuery') {
          observer.next({ data: { posts: { results: [contentFixture(operation.query, 'Post')], totalCount: 1 } } });
          observer.complete();
        } else if (operation.operationName === 'multiCommentModerationSidebarQuery') {
          observer.next({ data: { comments: { results: [contentFixture(operation.query, 'Comment')], totalCount: 1 } } });
          observer.complete();
        } else if (operation.operationName === 'multiModerationTemplateRejectContentDialogQuery') {
          observer.next({ data: { moderationTemplates: { results: [], totalCount: 0 } } });
          observer.complete();
        } else {
          mutationVariables.push(operation.variables);
          mutations.push(observer);
        }
      })),
    });
    let reject = () => {};
    const onReady = (callback: () => void) => { reject = callback; };
    const wrapper = ({ children }: React.PropsWithChildren) => <ApolloProvider client={client}><PanelHarness collectionName={collectionName} skipRejectionPM={skipRejectionPM} onReady={onReady} />{children}</ApolloProvider>;
    const { result, unmount } = renderHook(() => useModeratedUserContents('user'), { wrapper });
    await waitFor(() => expect(result.current.posts.length + result.current.comments.length).toBe(2));
    await act(async () => { reject(); });
    await waitFor(() => expect(mutations).toHaveLength(1));
    expect(mutationVariables[0]).toEqual({
      selector: { _id: collectionName === 'Posts' ? 'post' : 'comment' },
      data: {
        rejected: true,
        rejectedReason: '<p>Rejected reason</p>',
        ...(collectionName === 'Posts' ? { skipRejectionPM } : {}),
      },
    });
    await waitFor(() => expect((collectionName === 'Posts' ? result.current.posts[0] : result.current.comments[0]).rejected).toBe(true));
    unmount();
    client.stop();
  });
});
