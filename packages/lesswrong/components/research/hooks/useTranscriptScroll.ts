'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
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
  scrollRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
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
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
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
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight - prependAnchorRef.current;
      return;
    }

    if (isPinnedToBottomRef.current) {
      scrollToBottom();
    }
  }, [resetKey, events, scrollToBottom]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pinIfPinned = () => {
      if (isPinnedToBottomRef.current && el.scrollTop !== el.scrollHeight - el.clientHeight) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      }
    };
    const observer = new ResizeObserver(pinIfPinned);
    observer.observe(el);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  return { scrollRef, contentRef, onScroll, scrollToBottom };
}
