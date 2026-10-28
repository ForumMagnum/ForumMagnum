'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2's Post tab shows the post as the Editor
// tab left it in this browser (see widgetDragEdits), or as the editor starts it before any edits. The
// HTML is the editor's own export, rendered by the post page's usual body.
import React, { useEffect, useMemo, useState } from 'react';
import { IframeWidgetSrcdocOverrides } from '@/components/contents/HydratedIframeWidget';
import type { VotingProps } from '@/components/votes/votingProps';
import PostBody from './PostBody';
import { WIDGET_DRAG_DEMO_PATH } from './constants';
import { editsForReader, loadEdits } from './widgetDragEdits';

export function WidgetDragPostBody({ post, isOldVersion, voteProps }: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsListWithVotes,
  isOldVersion: boolean,
  voteProps: VotingProps<PostsWithNavigation | PostsWithNavigationAndRevision | PostsListWithVotes>,
}) {
  const [content, setContent] = useState<{ html: string, srcdocs: Record<string, string> } | null>(null);
  // PostBody shows the saved post's own HTML (with side comment markers) when it has side comments, so
  // it gets none here.
  const unsavedPost = useMemo(() => ('sideComments' in post ? { ...post, sideComments: null } : post), [post]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch(`${WIDGET_DRAG_DEMO_PATH}/default-post`);
      const start: { base: string, html: string } = await response.json();
      if (!cancelled) setContent(editsForReader(loadEdits(start.base) ?? start.html));
    })();
    return () => { cancelled = true; };
  }, []);
  // Until then, a blank page rather than the saved post (which isn't what the editor shows).
  if (!content) return <div style={{ minHeight: '100vh' }} data-testid="widget-drag-post-loading" />;
  return <IframeWidgetSrcdocOverrides.Provider value={content.srcdocs}>
    <div data-testid="widget-drag-post-body">
      <PostBody post={unsavedPost} html={content.html} isOldVersion={isOldVersion} voteProps={voteProps} />
    </div>
  </IframeWidgetSrcdocOverrides.Provider>;
}
