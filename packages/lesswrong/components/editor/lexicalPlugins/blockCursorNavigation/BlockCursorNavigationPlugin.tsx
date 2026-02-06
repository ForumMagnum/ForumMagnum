/**
 * BlockCursorNavigationPlugin (Sentinel Approach)
 *
 * Replaces Lexical's built-in block cursor overlay with "sentinel" paragraph
 * nodes — real, zero-height paragraph nodes inserted between block-level
 * elements. These give the browser native cursor positions, so arrow key
 * navigation works without custom command interception.
 *
 * Responsibilities:
 * 1. Sentinel maintenance: ensures SentinelParagraphNodes exist at every
 *    gap position between block-level nodes (images, HRs, embeds, etc.)
 * 2. Sentinel promotion: when the user types into a sentinel, it's promoted
 *    to a real ParagraphNode so the content is serialized normally.
 * 3. FootnoteSection guard: prevents the cursor from being placed after a
 *    FootnoteSectionNode, which must remain fixed at the end of the document.
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {
  $addUpdateTag,
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  HISTORY_MERGE_TAG,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import {useEffect} from 'react';
import {$isFootnoteSectionNode} from '@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode';
import {
  $createSentinelParagraphNode,
  $isSentinelParagraphNode,
  SentinelParagraphNode,
} from './SentinelParagraphNode';

/**
 * Tag used to identify updates caused by sentinel reconciliation, so we
 * can avoid re-triggering reconciliation in a loop.
 */
const SENTINEL_RECONCILE_TAG = 'sentinel-reconcile';

/**
 * CSS class added to the sentinel DOM element when the Lexical selection is
 * inside it. We can't use :focus-within because in a contenteditable
 * container, DOM focus stays on the root editor element — individual child
 * elements never receive their own focus event.
 */
const SENTINEL_FOCUSED_CLASS = 'sentinel-focused';

/**
 * Mirrors Lexical's internal `needsBlockCursor` check. Returns true for
 * block-level nodes that the browser can't natively place a cursor
 * before/after: DecoratorNodes (like HorizontalRuleNode) and ElementNodes
 * with canBeEmpty()=false (like ImageNode).
 */
function $needsBlockCursor(
  node: LexicalNode | null,
): boolean {
  if (node === null) {
    return false;
  }
  if ($isDecoratorNode(node)) {
    return !node.isInline();
  }
  return $isElementNode(node) && !node.canBeEmpty() && !node.isInline();
}

/**
 * Determines if a sentinel is needed between two adjacent content nodes.
 * A sentinel is needed when at least one neighbor satisfies needsBlockCursor.
 * Exception: never place a sentinel after FootnoteSectionNode.
 */
function $isSentinelNeeded(
  prev: LexicalNode | null,
  next: LexicalNode | null,
): boolean {
  // Never place sentinel after FootnoteSectionNode
  if ($isFootnoteSectionNode(prev)) {
    return false;
  }
  return $needsBlockCursor(prev) || $needsBlockCursor(next);
}

/**
 * Finds the next non-sentinel child starting from `startIndex` in the
 * children array.
 */
function findNextContentNode(
  children: LexicalNode[],
  startIndex: number,
): LexicalNode | null {
  for (let i = startIndex; i < children.length; i++) {
    if (!$isSentinelParagraphNode(children[i])) {
      return children[i];
    }
  }
  return null;
}

/**
 * Scans root children and ensures SentinelParagraphNodes exist at every gap
 * position that needs one, removing any that are no longer needed.
 *
 * A sentinel is needed between consecutive root-level children A and B when
 * at least one satisfies `needsBlockCursor`. Sentinels are also placed:
 * - Before the first child if it needsBlockCursor
 * - After the last non-footnote child if it needsBlockCursor
 * - Never after FootnoteSectionNode
 *
 * This function is designed to be idempotent: if sentinels are already
 * correctly placed, it makes no changes.
 */
function $reconcileSentinels(): void {
  const root = $getRoot();
  const children = root.getChildren();

  // Track the most recent content (non-sentinel) node as we scan left to right
  let prevContent: LexicalNode | null = null;

  for (const child of children) {
    if ($isSentinelParagraphNode(child)) {
      // Existing sentinel: check if it's still needed by looking at its
      // content neighbors. We find the next content node by scanning forward
      // from the child's position in the tree.
      const nextSibling = child.getNextSibling();
      const nextContent = nextSibling !== null && $isSentinelParagraphNode(nextSibling)
        ? findNextContentNode(children, children.indexOf(nextSibling))
        : (nextSibling ?? null);

      if (!$isSentinelNeeded(prevContent, nextContent)) {
        child.remove();
      }
      // Don't update prevContent — sentinels don't count as content
      continue;
    }

    // Content node: check if a sentinel should exist between prevContent
    // and this node.
    if ($isSentinelNeeded(prevContent, child)) {
      // Only insert if there isn't already a sentinel right before this node
      const prevSibling = child.getPreviousSibling();
      if (!$isSentinelParagraphNode(prevSibling)) {
        child.insertBefore($createSentinelParagraphNode());
      }
    }

    prevContent = child;
  }

  // Trailing gap: after the last content node (but not after FootnoteSectionNode)
  if (
    prevContent !== null &&
    !$isFootnoteSectionNode(prevContent) &&
    $needsBlockCursor(prevContent)
  ) {
    const lastChild = root.getLastChild();
    if (!$isSentinelParagraphNode(lastChild)) {
      root.append($createSentinelParagraphNode());
    }
  }

  // Leading gap: before the first content node
  const firstChild = root.getFirstChild();
  if (
    firstChild !== null &&
    !$isSentinelParagraphNode(firstChild) &&
    $needsBlockCursor(firstChild)
  ) {
    // Double-check that we haven't already inserted one via the main loop
    // (this handles the case where firstChild was also the first iteration target)
    const actualFirst = root.getFirstChild();
    if (!$isSentinelParagraphNode(actualFirst)) {
      firstChild.insertBefore($createSentinelParagraphNode());
    }
  }
}

/**
 * Node transform: when a SentinelParagraphNode gains text content (because
 * the user typed into it), promote it to a real ParagraphNode. This ensures
 * the content is serialized normally and shows up in HTML export.
 */
function $promoteSentinelWithContent(node: SentinelParagraphNode): void {
  const textContent = node.getTextContent();
  if (textContent.length === 0) {
    return;
  }

  // Replace the sentinel with a real ParagraphNode, moving all children over
  const paragraph = $createParagraphNode();
  const nodeChildren = node.getChildren();
  for (const child of nodeChildren) {
    paragraph.append(child);
  }
  node.replace(paragraph);
  paragraph.selectEnd();
}

/**
 * If the selection is at the very end of root and the last child is a
 * FootnoteSectionNode, redirect the cursor to just before the footnote
 * section. This catches cases where the browser's default arrow behavior
 * places the cursor after the footnotes.
 *
 * With sentinels, if there's a sentinel before the FootnoteSectionNode,
 * the cursor is redirected into that sentinel.
 */
function $guardSelectionAfterFootnoteSection(editor: LexicalEditor): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return;
  }

  const {anchor} = selection;
  if (anchor.type !== 'element') {
    return;
  }

  const anchorNode = anchor.getNode();
  if (!$isRootNode(anchorNode)) {
    return;
  }

  const lastChild = anchorNode.getLastChild();
  if (!$isFootnoteSectionNode(lastChild)) {
    return;
  }

  if (anchor.offset === anchorNode.getChildrenSize()) {
    // Selection is at the end of root, after the FootnoteSectionNode.
    // Redirect to the sentinel before footnotes (if one exists) or to the
    // element-level gap before footnotes.
    editor.update(() => {
      const root = $getRoot();
      const footnoteSectionNode = root.getLastChild();
      if (!$isFootnoteSectionNode(footnoteSectionNode)) {
        return;
      }

      const prevSibling = footnoteSectionNode.getPreviousSibling();
      if ($isSentinelParagraphNode(prevSibling)) {
        prevSibling.selectEnd();
      } else {
        const index = footnoteSectionNode.getIndexWithinParent();
        root.select(index, index);
      }
    });
  }
}

/**
 * Tracks which sentinel DOM element currently has the cursor and toggles the
 * SENTINEL_FOCUSED_CLASS on it. Called after every editor state update so the
 * blinking cursor indicator stays in sync with the Lexical selection.
 */
function updateSentinelFocusClass(
  editor: LexicalEditor,
  prevFocusedKeyRef: { current: string | null },
): void {
  const selection = $getSelection();

  let focusedSentinelKey: string | null = null;

  if ($isRangeSelection(selection) && selection.isCollapsed()) {
    const anchorNode = selection.anchor.getNode();
    // The anchor could be in the sentinel itself (element-type anchor) or in
    // a text node child of the sentinel (text-type anchor).
    if ($isSentinelParagraphNode(anchorNode)) {
      focusedSentinelKey = anchorNode.getKey();
    } else {
      const parent = anchorNode.getParent();
      if ($isSentinelParagraphNode(parent)) {
        focusedSentinelKey = parent.getKey();
      }
    }
  }

  const prevKey = prevFocusedKeyRef.current;
  if (prevKey === focusedSentinelKey) {
    return;
  }

  // Remove class from the previously focused sentinel
  if (prevKey !== null) {
    const prevDom = editor.getElementByKey(prevKey);
    if (prevDom !== null) {
      prevDom.classList.remove(SENTINEL_FOCUSED_CLASS);
    }
  }

  // Add class to the newly focused sentinel
  if (focusedSentinelKey !== null) {
    const dom = editor.getElementByKey(focusedSentinelKey);
    if (dom !== null) {
      dom.classList.add(SENTINEL_FOCUSED_CLASS);
    }
  }

  prevFocusedKeyRef.current = focusedSentinelKey;
}

export default function BlockCursorNavigationPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Mutable ref to track which sentinel was last focused, so we can
    // remove the class when the cursor moves away.
    const prevFocusedKeyRef: { current: string | null } = { current: null };

    return mergeRegister(
      // Sentinel maintenance: reconcile sentinels after every structural change
      editor.registerUpdateListener(({tags}) => {
        // Skip if this update was itself a sentinel reconciliation
        // (prevents infinite loops)
        if (tags.has(SENTINEL_RECONCILE_TAG)) {
          return;
        }

        editor.update(
          () => {
            $addUpdateTag(HISTORY_MERGE_TAG);
            $addUpdateTag(SENTINEL_RECONCILE_TAG);
            $reconcileSentinels();
          },
          {tag: SENTINEL_RECONCILE_TAG},
        );
      }),

      // Sentinel promotion: when user types into a sentinel, promote it to
      // a real ParagraphNode
      editor.registerNodeTransform(
        SentinelParagraphNode,
        $promoteSentinelWithContent,
      ),

      // Guard against the selection ending up after a FootnoteSectionNode
      // through any means (browser default behavior, programmatic changes, etc.)
      editor.registerUpdateListener(({editorState, tags}) => {
        if (tags.has(SENTINEL_RECONCILE_TAG)) {
          return;
        }
        editorState.read(() => {
          $guardSelectionAfterFootnoteSection(editor);
        });
      }),

      // Track which sentinel has the cursor and toggle the focused CSS class
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          updateSentinelFocusClass(editor, prevFocusedKeyRef);
        });
      }),
    );
  }, [editor]);

  return null;
}
