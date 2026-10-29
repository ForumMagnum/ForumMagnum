'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2's Post tab shows the post as the Editor
// tab left it in this browser (see widgetDragEdits), or as the editor starts it before any edits. The
// HTML is the editor's own export, rendered by the post page's usual body.
// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3's demo posts pass their own starting
// post and storage key.
import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetBlocksDemo } from './widgetBlocksDemo';
import { IframeWidgetSrcdocOverrides } from '@/components/contents/HydratedIframeWidget';
import type { VotingProps } from '@/components/votes/votingProps';
import PostBody from './PostBody';
import { WIDGET_DRAG_DEMO_PATH } from './constants';
import { WIDGET_DRAG_STORAGE_KEY, editsForReader, loadEdits } from './widgetDragEdits';

export function WidgetDragPostBody({ post, isOldVersion, voteProps, defaultPostPath = `${WIDGET_DRAG_DEMO_PATH}/default-post`, storageKey = WIDGET_DRAG_STORAGE_KEY }: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsListWithVotes,
  isOldVersion: boolean,
  voteProps: VotingProps<PostsWithNavigation | PostsWithNavigationAndRevision | PostsListWithVotes>,
  defaultPostPath?: string,
  storageKey?: string,
}) {
  const [content, setContent] = useState<{ html: string, srcdocs: Record<string, string> } | null>(null);
  // PostBody shows the saved post's own HTML (with side comment markers) when it has side comments, so
  // it gets none here.
  const unsavedPost = useMemo(() => ('sideComments' in post ? { ...post, sideComments: null } : post), [post]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch(defaultPostPath);
      const start: { base: string, html: string } = await response.json();
      if (!cancelled) setContent(editsForReader(loadEdits(start.base, storageKey) ?? start.html));
    })();
    return () => { cancelled = true; };
  }, [defaultPostPath, storageKey]);
  // Until then, a blank page rather than the saved post (which isn't what the editor shows).
  if (!content) return <div style={{ minHeight: '100vh' }} data-testid="widget-drag-post-loading" />;
  return <IframeWidgetSrcdocOverrides.Provider value={content.srcdocs}>
    <div data-testid="widget-drag-post-body">
      <PostBody post={unsavedPost} html={content.html} isOldVersion={isOldVersion} voteProps={voteProps} />
    </div>
  </IframeWidgetSrcdocOverrides.Provider>;
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): an Experiment 3 demo post's HTML as its Editor tab left
 * it in this browser (or as the editor starts it), loaded by the post page itself so that its table of
 * contents and heading anchors come from the same HTML the body shows. Null until loaded, or with no demo.
 */
export function useWidgetBlocksContent(demo: WidgetBlocksDemo | null): { html: string, srcdocs: Record<string, string> } | null {
  const [content, setContent] = useState<{ html: string, srcdocs: Record<string, string> } | null>(null);
  const defaultPostPath = demo?.defaultPostPath;
  const storageKey = demo?.storageKey;
  useEffect(() => {
    if (!defaultPostPath || !storageKey) return;
    let cancelled = false;
    void (async () => {
      const response = await fetch(defaultPostPath);
      const start: { base: string, html: string } = await response.json();
      if (!cancelled) setContent(editsForReader(loadEdits(start.base, storageKey) ?? start.html));
    })();
    return () => { cancelled = true; };
  }, [defaultPostPath, storageKey]);
  return content;
}

/** EXPERIMENT (experiment/iframe-layout-ronny-exp3): an Experiment 3 demo post's body (see useWidgetBlocksContent). */
export function WidgetBlocksPostBody({ post, html, srcdocs, isOldVersion, voteProps }: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsListWithVotes,
  /** Null while loading. */
  html: string | null,
  srcdocs: Record<string, string>,
  isOldVersion: boolean,
  voteProps: VotingProps<PostsWithNavigation | PostsWithNavigationAndRevision | PostsListWithVotes>,
}) {
  const unsavedPost = useMemo(() => ('sideComments' in post ? { ...post, sideComments: null } : post), [post]);
  if (html === null) return <div style={{ minHeight: '100vh' }} data-testid="widget-drag-post-loading" />;
  return <IframeWidgetSrcdocOverrides.Provider value={srcdocs}>
    <div data-testid="widget-drag-post-body">
      <PostBody post={unsavedPost} html={html} isOldVersion={isOldVersion} voteProps={voteProps} />
    </div>
  </IframeWidgetSrcdocOverrides.Provider>;
}
