import { useEffect, useSyncExternalStore } from "react";
import { isCommentNarratable } from "@/lib/narration/narratableComments";
import type { CommentTreeNode } from "@/lib/utils/unflatten";

/**
 * What the narration player and a post page's comments know about each other.
 * The player is mounted as a dialog, outside the post page's part of the React
 * tree, so this is shared through module-level values rather than context:
 * the post page publishes its comments here for the player to traverse, and
 * the player says which comment it's reading, for that comment to expand.
 */

export interface NarrationCommentEntry {
  comment: CommentsList
  /** The comments that this one is nested under, outermost first */
  ancestors: CommentsList[]
}

/** A comment, or a reply under it, is where narration has got to */
export type NarrationCommentFocus = "self"|"descendant";

const COMMENT_NODE_SELECTOR = ".comments-node";
const COMMENT_BODY_SELECTOR = ".CommentBody-root";

let displayedCommentTree: Array<CommentTreeNode<CommentsList>> = [];
/** The comment being narrated, preceded by its ancestors. Empty when no comment is. */
let focusedCommentIds: string[] = [];
const focusListeners = new Set<() => void>();

function flattenCommentTree(nodes: Array<CommentTreeNode<CommentsList>>, ancestors: CommentsList[]): NarrationCommentEntry[] {
  return nodes.flatMap(node => [
    { comment: node.item, ancestors },
    ...flattenCommentTree(node.children, [...ancestors, node.item]),
  ]);
}

/** The post page's comments, in the order they're displayed */
function getDisplayedComments(): NarrationCommentEntry[] {
  return flattenCommentTree(displayedCommentTree, []);
}

/**
 * Comments with no karma, and replies under them, aren't read unless the
 * listener asked for them: `unlockedCommentIds` are the ones they asked for.
 */
function isSkippedForLowKarma({ comment, ancestors }: NarrationCommentEntry, unlockedCommentIds: ReadonlySet<string>): boolean {
  return [...ancestors, comment].some(
    threadComment => (threadComment.baseScore ?? 0) <= 0 && !unlockedCommentIds.has(threadComment._id)
  );
}

/** Makes a post page's comment tree (as displayed, so in display order) the one that narration continues into */
export function usePublishedNarrationComments(commentTree: Array<CommentTreeNode<CommentsList>>) {
  useEffect(() => {
    displayedCommentTree = commentTree;
    return () => {
      if (displayedCommentTree === commentTree) {
        displayedCommentTree = [];
      }
    };
  }, [commentTree]);
}

export function findNarrationComment(commentId: string): NarrationCommentEntry|null {
  return getDisplayedComments().find(entry => entry.comment._id === commentId) ?? null;
}

/**
 * The comment that's read after the given one (or first, if null). Null if
 * there are no more, or if the given comment is no longer displayed.
 */
export function getNextNarrationComment(afterCommentId: string|null, unlockedCommentIds: ReadonlySet<string>): NarrationCommentEntry|null {
  const entries = getDisplayedComments();
  const afterIndex = entries.findIndex(entry => entry.comment._id === afterCommentId);
  if (afterCommentId !== null && afterIndex < 0) {
    return null;
  }
  return entries.slice(afterIndex + 1).find(
    entry => isCommentNarratable(entry.comment) && !isSkippedForLowKarma(entry, unlockedCommentIds)
  ) ?? null;
}

/**
 * The element holding the comment's text. This skips the bodies of other
 * comments that are displayed inside the comment's element: its replies, and
 * the parent comment if that's being shown above it.
 */
export function findCommentBodyElement(commentId: string): Element|null {
  const commentElement = document.getElementById(commentId);
  const bodyElements = Array.from(commentElement?.querySelectorAll(COMMENT_BODY_SELECTOR) ?? []);
  return bodyElements.find(bodyElement => bodyElement.closest(COMMENT_NODE_SELECTOR) === commentElement) ?? null;
}

/** The displayed comment whose text the element is part of, if any */
export function findNarrationCommentForElement(element: Element): NarrationCommentEntry|null {
  const commentElement = element.closest(COMMENT_BODY_SELECTOR)?.closest(COMMENT_NODE_SELECTOR);
  return commentElement?.id ? findNarrationComment(commentElement.id) : null;
}

export function setNarrationFocusedComment(entry: NarrationCommentEntry|null) {
  focusedCommentIds = entry ? [...entry.ancestors, entry.comment].map(comment => comment._id) : [];
  for (const listener of focusListeners) {
    listener();
  }
}

function subscribeToNarrationFocus(listener: () => void): () => void {
  focusListeners.add(listener);
  return () => {
    focusListeners.delete(listener);
  };
}

function getNarrationCommentFocus(commentId: string): NarrationCommentFocus|null {
  if (focusedCommentIds.at(-1) === commentId) {
    return "self";
  }
  return focusedCommentIds.includes(commentId) ? "descendant" : null;
}

function getServerNarrationCommentFocus(): null {
  return null;
}

/** Whether narration is reading this comment or one of the replies under it */
export function useNarrationCommentFocus(commentId: string): NarrationCommentFocus|null {
  return useSyncExternalStore(
    subscribeToNarrationFocus,
    () => getNarrationCommentFocus(commentId),
    getServerNarrationCommentFocus,
  );
}
