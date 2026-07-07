'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { RefCallback } from 'react';
import type { ConversationEvent } from './useConversationStream';

const BOTTOM_THRESHOLD_PX = 64;
// Page in the next older batch once the user scrolls within this of the top.
const TOP_THRESHOLD_PX = 200;

function isScrolledNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
}

interface UseTranscriptScrollParams {
  // Visible events in ascending seq order; events[0] is the topmost rendered row.
  events: ConversationEvent[];
  // Changing this (the conversationId) re-pins to the bottom and clears anchoring.
  resetKey: string | null | undefined;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlder: () => void;
  // Invoked whenever the viewport reaches the bottom (pin, user scroll-to-bottom,
  // or programmatic), so a consumer can clear an unread indicator.
  onReachedBottom?: () => void;
}

interface TranscriptScroll {
  /**
   * Callback refs (not RefObjects): the scroll container can mount after the
   * hook's first render (loading placeholders) or be unmounted/remounted (the
   * panel-mode file-browser toggle swaps the transcript out), so observer
   * attachment and the re-pin must follow the node, not a mount-time effect.
   */
  scrollRef: RefCallback<HTMLDivElement>;
  contentRef: RefCallback<HTMLDivElement>;
  onScroll: () => void;
  scrollToBottom: () => void;
}

/**
 * Scroll behavior shared by every conversation-transcript view (the chat pane
 * and the in-document agent block). It keeps the view pinned to the bottom as
 * events stream in — unless the user has scrolled up — and pages in older
 * history when they scroll near the top, re-anchoring the viewport so the
 * prepend doesn't shift the content under them.
 *
 * The caller must render the events into `scrollRef`, attach `onScroll`, and set
 * `overflow-anchor: none` on the scroll container so the browser's native scroll
 * anchoring can't fight the manual re-anchor done here.
 */
export function useTranscriptScroll({
  events,
  resetKey,
  hasMoreOlder,
  loadingOlder,
  loadOlder,
  onReachedBottom,
}: UseTranscriptScrollParams): TranscriptScroll {
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const contentElRef = useRef<HTMLDivElement | null>(null);
  const isPinnedToBottomRef = useRef(true);
  // Latest viewport distance-from-bottom, refreshed on every scroll, so a
  // prepend can restore the exact position the user is at when the page lands.
  const prependAnchorRef = useRef<number | null>(null);
  const prevTopSeqRef = useRef<number | null>(null);
  const prevResetKeyRef = useRef<string | null | undefined>(undefined);

  // Mirror the (possibly inline) callback into a ref so scrollToBottom/onScroll
  // can stay stable while always invoking the latest closure.
  const onReachedBottomRef = useRef(onReachedBottom);
  onReachedBottomRef.current = onReachedBottom;

  const scrollToBottom = useCallback(() => {
    isPinnedToBottomRef.current = true;
    onReachedBottomRef.current?.();
    const el = scrollElRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollElRef.current;
    if (!el) return;
    isPinnedToBottomRef.current = isScrolledNearBottom(el);
    if (isPinnedToBottomRef.current) onReachedBottomRef.current?.();
    // Track the live distance from the bottom so a prepend can restore the exact
    // viewport position the user is at when the page lands.
    prependAnchorRef.current = el.scrollHeight - el.scrollTop;
    if (hasMoreOlder && !loadingOlder && el.scrollTop <= TOP_THRESHOLD_PX) {
      loadOlder();
    }
  }, [hasMoreOlder, loadingOlder, loadOlder]);

  // Pin to bottom as content streams in (unless the user scrolled up), restore
  // the anchor after an older-history prepend, and re-pin on conversation switch.
  // Layout effect so the adjustment lands before paint.
  useLayoutEffect(() => {
    const topSeq = events.length > 0 ? events[0].seq : null;
    const prevTopSeq = prevTopSeqRef.current;
    prevTopSeqRef.current = topSeq;

    const resetChanged = prevResetKeyRef.current !== resetKey;
    prevResetKeyRef.current = resetKey;
    if (resetChanged) {
      prependAnchorRef.current = null;
      scrollToBottom();
      return;
    }

    // Older history was just prepended (topmost seq moved earlier): restore the
    // live distance-from-bottom so the viewport stays on the same content. The
    // ref isn't cleared — the programmatic scrollTop below fires a scroll event
    // that refreshes it to the (unchanged) position, ready for the next page.
    if (prependAnchorRef.current != null && topSeq != null && prevTopSeq != null && topSeq < prevTopSeq) {
      const el = scrollElRef.current;
      if (el) el.scrollTop = el.scrollHeight - prependAnchorRef.current;
      return;
    }

    if (isPinnedToBottomRef.current) {
      scrollToBottom();
    }
  }, [resetKey, events, scrollToBottom]);

  // Re-pin on any size change of the container or its content: streaming
  // output grows the content without scroll events, and container resizes
  // (panel drag, fullscreen toggle) would otherwise unpin the bottom.
  const pinIfPinned = useCallback(() => {
    const el = scrollElRef.current;
    if (!el) return;
    if (isPinnedToBottomRef.current && el.scrollTop !== el.scrollHeight - el.clientHeight) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
    }
  }, []);

  // One lazily-created observer, re-targeted whenever either node (re)mounts.
  const observerRef = useRef<ResizeObserver | null>(null);
  const syncObserver = useCallback(() => {
    observerRef.current?.disconnect();
    const el = scrollElRef.current;
    if (!el) return;
    if (!observerRef.current) observerRef.current = new ResizeObserver(pinIfPinned);
    observerRef.current.observe(el);
    if (contentElRef.current) observerRef.current.observe(contentElRef.current);
  }, [pinIfPinned]);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const scrollRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      const remounted = el !== null && el !== scrollElRef.current;
      scrollElRef.current = el;
      syncObserver();
      // A freshly-mounted container starts at scrollTop 0 (e.g. the transcript
      // returning after the file-browser toggle); restore the pin immediately.
      if (remounted) pinIfPinned();
    },
    [syncObserver, pinIfPinned],
  );
  const contentRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      contentElRef.current = el;
      syncObserver();
    },
    [syncObserver],
  );

  return { scrollRef, contentRef, onScroll, scrollToBottom };
}
