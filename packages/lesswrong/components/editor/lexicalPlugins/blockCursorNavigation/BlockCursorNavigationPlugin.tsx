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
  COMMAND_PRIORITY_LOW,
  HISTORY_MERGE_TAG,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import {useEffect} from 'react';
import {$isListNode} from '@lexical/list';
import {$isFootnoteSectionNode} from '@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode';
import {
  $createSentinelParagraphNode,
  $isSentinelParagraphNode,
  SentinelParagraphNode,
} from './SentinelParagraphNode';
import { $isIframeWidgetNode } from '@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode';

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

type SentinelTraversalDirection = 'backward' | 'forward';

/**
 * Returns true for block-level nodes that the browser can't natively place
 * a cursor before/after: DecoratorNodes (like HorizontalRuleNode) and
 * ElementNodes with canBeEmpty()=false (like ImageNode, LLMContentBlockNode).
 *
 * Lists are excluded despite having canBeEmpty()=false — the browser handles
 * cursor placement around lists natively, and sentinels would interfere with
 * normal backspace-to-merge behavior between a paragraph and the preceding list.
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
  if ($isListNode(node)) {
    return false;
  }
  if ($isIframeWidgetNode(node)) {
    return true;
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
  // Track whether we've already kept a sentinel for the current gap between
  // content nodes. Without this, duplicate consecutive sentinels can't be
  // cleaned up: prevContent never advances past sentinels, so each duplicate
  // sees the same (prevContent, nextContent) pair and is individually deemed
  // "needed". This can happen when Yjs undo restores sentinels from the
  // document history while reconciliation also needs sentinels in the same gap.
  let sentinelKeptForCurrentGap = false;

  for (const child of children) {
    if ($isSentinelParagraphNode(child)) {
      // If we already kept a sentinel for this gap, remove duplicates
      if (sentinelKeptForCurrentGap) {
        child.remove();
        continue;
      }

      // Existing sentinel: check if it's still needed by looking at its
      // content neighbors. We find the next content node by scanning forward
      // from the child's position in the tree.
      const nextSibling = child.getNextSibling();
      const nextContent = nextSibling !== null && $isSentinelParagraphNode(nextSibling)
        ? findNextContentNode(children, children.indexOf(nextSibling))
        : (nextSibling ?? null);

      if (!$isSentinelNeeded(prevContent, nextContent)) {
        child.remove();
      } else {
        sentinelKeptForCurrentGap = true;
      }
      // Don't update prevContent — sentinels don't count as content
      continue;
    }

    // Content node: reset the sentinel-kept flag for the next gap
    sentinelKeptForCurrentGap = false;

    // Check if a sentinel should exist between prevContent and this node.
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

function getCurrentSentinelFromSelection(): SentinelParagraphNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();
  if ($isSentinelParagraphNode(anchorNode)) {
    return anchorNode;
  }

  const parent = anchorNode.getParent();
  if ($isSentinelParagraphNode(parent)) {
    return parent;
  }

  return null;
}

function shouldSkipThroughFromSentinel(
  node: LexicalNode,
  editor: LexicalEditor,
): boolean {
  if ($isIframeWidgetNode(node)) {
    const widgetDom = editor.getElementByKey(node.getKey());
    return widgetDom?.dataset.view === 'preview';
  }
  
  return false;
}

function handleSentinelArrowTraversal(
  event: KeyboardEvent,
  direction: SentinelTraversalDirection,
  editor: LexicalEditor,
): boolean {
  const sentinel = getCurrentSentinelFromSelection();
  if (!sentinel) {
    return false;
  }

  const adjacentNode = direction === 'forward'
    ? sentinel.getNextSibling()
    : sentinel.getPreviousSibling();
  if (!adjacentNode || !shouldSkipThroughFromSentinel(adjacentNode, editor)) {
    return false;
  }

  const targetSentinel = direction === 'forward'
    ? adjacentNode.getNextSibling()
    : adjacentNode.getPreviousSibling();
  if (!$isSentinelParagraphNode(targetSentinel)) {
    return false;
  }

  event.preventDefault();
  targetSentinel.selectEnd();
  return true;
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

      // Sentinel-aware backspace handling:
      // 1. Cursor in a sentinel after a block element → delete the block element
      // 2. Cursor at start of a paragraph after a sentinel → move cursor to sentinel
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const sentinel = $isSentinelParagraphNode(anchorNode)
            ? anchorNode
            : $isSentinelParagraphNode(anchorNode.getParent())
              ? anchorNode.getParent()
              : null;

          // Case 1: cursor is inside a sentinel — delete the preceding block element
          if (sentinel) {
            const prevSibling = sentinel.getPreviousSibling();
            if (prevSibling && $needsBlockCursor(prevSibling)) {
              event.preventDefault();
              prevSibling.remove();
              return true;
            }
            return false;
          }

          // Case 2: cursor at start of a non-sentinel block whose previous
          // sibling is a sentinel — move cursor into the sentinel instead of
          // merging across it
          if (selection.anchor.offset === 0) {
            const block = $isElementNode(anchorNode)
              ? anchorNode
              : anchorNode.getParent();
            if (block && $isElementNode(block)) {
              const prevSibling = block.getPreviousSibling();
              if ($isSentinelParagraphNode(prevSibling)) {
                event.preventDefault();
                prevSibling.selectEnd();
                return true;
              }
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => handleSentinelArrowTraversal(event, 'backward', editor),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        (event) => handleSentinelArrowTraversal(event, 'backward', editor),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => handleSentinelArrowTraversal(event, 'forward', editor),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        (event) => handleSentinelArrowTraversal(event, 'forward', editor),
        COMMAND_PRIORITY_LOW,
      ),

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
