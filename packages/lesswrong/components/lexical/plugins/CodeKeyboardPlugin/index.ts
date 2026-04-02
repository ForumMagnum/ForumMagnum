/**
 * Vendored keyboard handlers from @lexical/code's registerCodeHighlighting,
 * adapted to work with plain TextNode children instead of CodeHighlightNode.
 *
 * This separates the code block keyboard behavior (tab, indent, shift-lines,
 * home/end, gutter) from the syntax highlighting transforms, so that code
 * blocks can store plain TextNode children in the CRDT while retaining all
 * keyboard interactions.
 *
 * The only change from the original: every $isCodeHighlightNode check is
 * replaced with $isTextNode, which returns true for both TextNode and
 * CodeHighlightNode (since CodeHighlightNode extends TextNode). This means
 * these handlers work with both old documents (CodeHighlightNode children)
 * and new documents (plain TextNode children).
 *
 * Original source: node_modules/@lexical/code/LexicalCode.dev.mjs (v0.39.0)
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * Licensed under the MIT license.
 */

import { type JSX } from 'react';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getAdjacentCaret, mergeRegister } from '@lexical/utils';
import { $isCodeNode, CodeNode } from '@lexical/code';
import { IframeWidgetNode } from '../../embeds/IframeWidgetEmbed/IframeWidgetNode';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isTabNode,
  $isLineBreakNode,
  $isElementNode,
  $createTabNode,
  $createLineBreakNode,
  $createPoint,
  $insertNodes,
  $getNodeByKey,
  $getSiblingCaret,
  getTextDirection,
  $setSelectionFromCaretRange,
  $getCaretRangeInDirection,
  $getCaretRange,
  $getTextPointCaret,
  $normalizeCaret,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  INSERT_TAB_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_TAB_COMMAND,
  MOVE_TO_START,
  MOVE_TO_END,
  COMMAND_PRIORITY_LOW,
  type ElementNode,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
  type TextNode,
} from 'lexical';

// ---------------------------------------------------------------------------
// Helper functions (vendored from @lexical/code, $isCodeHighlightNode → $isTextNode)
// ---------------------------------------------------------------------------

function $getLastMatchingCodeNode(
  anchor: LexicalNode,
  direction: 'previous' | 'next',
): LexicalNode {
  let matchingNode = anchor;
  let caret: ReturnType<typeof $getSiblingCaret> = $getSiblingCaret(anchor, direction);
  while (caret && ($isTextNode(caret.origin) || $isTabNode(caret.origin))) {
    matchingNode = caret.origin;
    caret = $getAdjacentCaret(caret);
  }
  return matchingNode;
}

function $getFirstCodeNodeOfLine(anchor: LexicalNode): LexicalNode {
  return $getLastMatchingCodeNode(anchor, 'previous');
}

function $getLastCodeNodeOfLine(anchor: LexicalNode): LexicalNode {
  return $getLastMatchingCodeNode(anchor, 'next');
}

function $getCodeLineDirection(
  anchor: LexicalNode,
): 'ltr' | 'rtl' | null {
  const start = $getFirstCodeNodeOfLine(anchor);
  const end = $getLastCodeNodeOfLine(anchor);
  let node: LexicalNode | null = start;
  while (node !== null) {
    if ($isTextNode(node)) {
      const direction = getTextDirection(node.getTextContent());
      if (direction !== null) {
        return direction;
      }
    }
    if (node === end) {
      break;
    }
    node = node.getNextSibling();
  }
  const parent = start.getParent();
  if ($isElementNode(parent)) {
    const parentDirection = parent.getDirection();
    if (parentDirection === 'ltr' || parentDirection === 'rtl') {
      return parentDirection;
    }
  }
  return null;
}

interface CodeLineOffset {
  node: LexicalNode;
  offset: number;
}

function findNextNonBlankInLine(
  anchor: LexicalNode,
  offset: number,
): CodeLineOffset | null {
  let node: LexicalNode | null = anchor;
  let nodeOffset = offset;
  let nodeTextContent = anchor.getTextContent();
  let nodeTextContentSize = anchor.getTextContentSize();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!$isTextNode(node) || nodeOffset === nodeTextContentSize) {
      node = node!.getNextSibling();
      if (node === null || $isLineBreakNode(node)) {
        return null;
      }
      if ($isTextNode(node)) {
        nodeOffset = 0;
        nodeTextContent = node.getTextContent();
        nodeTextContentSize = node.getTextContentSize();
      }
    }
    if ($isTextNode(node)) {
      if (nodeTextContent[nodeOffset] !== ' ') {
        return {
          node,
          offset: nodeOffset,
        };
      }
      nodeOffset++;
    }
  }
}

function $getStartOfCodeInLine(
  anchor: LexicalNode,
  offset: number,
): CodeLineOffset | null {
  let last: CodeLineOffset | null = null;
  let lastNonBlank: CodeLineOffset | null = null;
  let node: LexicalNode | null = anchor;
  let nodeOffset = offset;
  let nodeTextContent = anchor.getTextContent();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (nodeOffset === 0) {
      node = node!.getPreviousSibling();
      if (node === null) {
        break;
      }
      if (!($isTextNode(node) || $isTabNode(node) || $isLineBreakNode(node))) {
        throw new Error(
          'Expected a valid Code Node: TextNode, TabNode, LineBreakNode',
        );
      }
      if ($isLineBreakNode(node)) {
        last = { node, offset: 1 };
        break;
      }
      nodeOffset = Math.max(0, node.getTextContentSize() - 1);
      nodeTextContent = node.getTextContent();
    } else {
      nodeOffset--;
    }
    const character = nodeTextContent[nodeOffset];
    if ($isTextNode(node) && character !== ' ') {
      lastNonBlank = { node, offset: nodeOffset };
    }
  }
  // lastNonBlank !== null: anchor in the middle of code; move to line beginning
  if (lastNonBlank !== null) {
    return lastNonBlank;
  }
  // Spaces, tabs or nothing ahead of anchor
  let codeCharacterAtAnchorOffset: string | null = null;
  if (offset < anchor.getTextContentSize()) {
    if ($isTextNode(anchor)) {
      codeCharacterAtAnchorOffset = anchor.getTextContent()[offset];
    }
  } else {
    const nextSibling = anchor.getNextSibling();
    if (nextSibling !== null && $isTextNode(nextSibling)) {
      codeCharacterAtAnchorOffset = nextSibling.getTextContent()[0];
    }
  }
  if (
    codeCharacterAtAnchorOffset !== null &&
    codeCharacterAtAnchorOffset !== ' '
  ) {
    // Borderline whitespace and code, move to line beginning
    return last;
  } else {
    const nextNonBlank = findNextNonBlankInLine(anchor, offset);
    if (nextNonBlank !== null) {
      return nextNonBlank;
    } else {
      return last;
    }
  }
}

function $getEndOfCodeInLine(anchor: LexicalNode): LexicalNode {
  const lastNode = $getLastCodeNodeOfLine(anchor);
  if ($isLineBreakNode(lastNode)) {
    throw new Error('Unexpected lineBreakNode in getEndOfCodeInLine');
  }
  return lastNode;
}

function $isSelectionInCode(selection: RangeSelection): boolean {
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const anchorNode = selection.anchor.getNode();
  const maybeAnchorCodeNode = $isCodeNode(anchorNode)
    ? anchorNode
    : anchorNode.getParent();
  const focusNode = selection.focus.getNode();
  const maybeFocusCodeNode = $isCodeNode(focusNode)
    ? focusNode
    : focusNode.getParent();
  return (
    $isCodeNode(maybeAnchorCodeNode) &&
    maybeAnchorCodeNode.is(maybeFocusCodeNode)
  );
}

function $getCodeLines(
  selection: RangeSelection,
): LexicalNode[][] {
  const nodes = selection.getNodes();
  const lines: LexicalNode[][] = [];
  if (nodes.length === 1 && $isCodeNode(nodes[0])) {
    return lines;
  }
  let lastLine: LexicalNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!($isTextNode(node) || $isTabNode(node) || $isLineBreakNode(node))) {
      throw new Error(
        'Expected selection to be inside CodeBlock and consisting of TextNode, TabNode and LineBreakNode',
      );
    }
    if ($isLineBreakNode(node)) {
      if (lastLine.length > 0) {
        lines.push(lastLine);
        lastLine = [];
      }
    } else {
      lastLine.push(node);
    }
  }
  if (lastLine.length > 0) {
    const selectionEnd = selection.isBackward()
      ? selection.anchor
      : selection.focus;

    // Discard the last line if the selection ends exactly at the
    // start of the line (no real selection)
    const lastPoint = $createPoint(lastLine[0].getKey(), 0, 'text');
    if (!selectionEnd.is(lastPoint)) {
      lines.push(lastLine);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Command handler functions
// ---------------------------------------------------------------------------

function $handleTab(
  shiftKey: boolean,
): LexicalCommand<void> | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !$isSelectionInCode(selection)) {
    return null;
  }
  const indentOrOutdent = !shiftKey
    ? INDENT_CONTENT_COMMAND
    : OUTDENT_CONTENT_COMMAND;
  const tabOrOutdent = !shiftKey
    ? INSERT_TAB_COMMAND
    : OUTDENT_CONTENT_COMMAND;
  const anchor = selection.anchor;
  const focus = selection.focus;

  // 1. early decision when there is no real selection
  if (anchor.is(focus)) {
    return tabOrOutdent;
  }

  // 2. If only empty lines or multiple non-empty lines are selected: indent/outdent
  const codeLines = $getCodeLines(selection);
  if (codeLines.length !== 1) {
    return indentOrOutdent;
  }
  const codeLine = codeLines[0];
  const codeLineLength = codeLine.length;
  if (codeLineLength === 0) {
    throw new Error('$getCodeLines only extracts non-empty lines');
  }
  // Take into account the direction of the selection
  let selectionFirst;
  let selectionLast;
  if (selection.isBackward()) {
    selectionFirst = focus;
    selectionLast = anchor;
  } else {
    selectionFirst = anchor;
    selectionLast = focus;
  }

  // find boundary elements of the line
  const firstOfLine = $getFirstCodeNodeOfLine(codeLine[0]);
  const lastOfLine = $getLastCodeNodeOfLine(codeLine[0]);
  const anchorOfLine = $createPoint(firstOfLine.getKey(), 0, 'text');
  const focusOfLine = $createPoint(
    lastOfLine.getKey(),
    lastOfLine.getTextContentSize(),
    'text',
  );

  // 3. multiline because selection started strictly before the line
  if (selectionFirst.isBefore(anchorOfLine)) {
    return indentOrOutdent;
  }

  // 4. multiline because the selection stops strictly after the line
  if (focusOfLine.isBefore(selectionLast)) {
    return indentOrOutdent;
  }

  // The selection is within the line.
  // If it does not touch both borders, it needs a tab
  if (
    anchorOfLine.isBefore(selectionFirst) ||
    selectionLast.isBefore(focusOfLine)
  ) {
    return tabOrOutdent;
  }

  // 5. Selection is matching a full line on non-empty code
  return indentOrOutdent;
}

function $handleMultilineIndent(
  type: LexicalCommand<void>,
): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !$isSelectionInCode(selection)) {
    return false;
  }
  const codeLines = $getCodeLines(selection);
  const codeLinesLength = codeLines.length;

  // Special Indent case: selection is collapsed at the beginning of a line
  if (codeLinesLength === 0 && selection.isCollapsed()) {
    if (type === INDENT_CONTENT_COMMAND) {
      selection.insertNodes([$createTabNode()]);
    }
    return true;
  }

  // Special Indent case: selection is matching only one LineBreak
  if (
    codeLinesLength === 0 &&
    type === INDENT_CONTENT_COMMAND &&
    selection.getTextContent() === '\n'
  ) {
    const tabNode = $createTabNode();
    const lineBreakNode = $createLineBreakNode();
    const direction = selection.isBackward() ? 'previous' : 'next';
    selection.insertNodes([tabNode, lineBreakNode]);
    $setSelectionFromCaretRange(
      $getCaretRangeInDirection(
        $getCaretRange(
          $getTextPointCaret(tabNode, 'next', 0),
          $normalizeCaret($getSiblingCaret(lineBreakNode, 'next')),
        ),
        direction,
      ),
    );
    return true;
  }

  // Indent Non Empty Lines
  for (let i = 0; i < codeLinesLength; i++) {
    const line = codeLines[i];
    if (line.length > 0) {
      let firstOfLine = line[0];

      // make sure to consider the first node on the first line
      // because the line might not be fully selected
      if (i === 0) {
        firstOfLine = $getFirstCodeNodeOfLine(firstOfLine);
      }
      if (type === INDENT_CONTENT_COMMAND) {
        const tabNode = $createTabNode();
        firstOfLine.insertBefore(tabNode);
        // First real code line may need selection adjustment
        // when firstOfLine is at the selection boundary
        if (i === 0) {
          const anchorKey = selection.isBackward() ? 'focus' : 'anchor';
          const anchorLine = $createPoint(firstOfLine.getKey(), 0, 'text');
          if (selection[anchorKey].is(anchorLine)) {
            selection[anchorKey].set(tabNode.getKey(), 0, 'text');
          }
        }
      } else if ($isTabNode(firstOfLine)) {
        firstOfLine.remove();
      }
    }
  }
  return true;
}

function $handleShiftLines(
  type: LexicalCommand<KeyboardEvent>,
  event: KeyboardEvent,
): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const { anchor, focus } = selection;
  const anchorOffset = anchor.offset;
  const focusOffset = focus.offset;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const arrowIsUp = type === KEY_ARROW_UP_COMMAND;

  // Ensure the selection is within the codeblock
  if (
    !$isSelectionInCode(selection) ||
    !($isTextNode(anchorNode) || $isTabNode(anchorNode)) ||
    !($isTextNode(focusNode) || $isTabNode(focusNode))
  ) {
    return false;
  }
  if (!event.altKey) {
    // Handle moving selection out of the code block, given there are no
    // siblings that can natively take the selection.
    if (selection.isCollapsed()) {
      const codeNode = anchorNode.getParentOrThrow();
      if (
        arrowIsUp &&
        anchorOffset === 0 &&
        anchorNode.getPreviousSibling() === null
      ) {
        const codeNodeSibling = codeNode.getPreviousSibling();
        if (codeNodeSibling === null) {
          codeNode.selectPrevious();
          event.preventDefault();
          return true;
        }
      } else if (
        !arrowIsUp &&
        anchorOffset === anchorNode.getTextContentSize() &&
        anchorNode.getNextSibling() === null
      ) {
        const codeNodeSibling = codeNode.getNextSibling();
        if (codeNodeSibling === null) {
          codeNode.selectNext();
          event.preventDefault();
          return true;
        }
      }
    }
    return false;
  }
  let start;
  let end;
  if (anchorNode.isBefore(focusNode)) {
    start = $getFirstCodeNodeOfLine(anchorNode);
    end = $getLastCodeNodeOfLine(focusNode);
  } else {
    start = $getFirstCodeNodeOfLine(focusNode);
    end = $getLastCodeNodeOfLine(anchorNode);
  }
  if (start == null || end == null) {
    return false;
  }
  const range = start.getNodesBetween(end);
  for (let i = 0; i < range.length; i++) {
    const node = range[i];
    if (!$isTextNode(node) && !$isTabNode(node) && !$isLineBreakNode(node)) {
      return false;
    }
  }

  // After this point, we know the selection is within the codeblock. We may
  // not be able to actually move the lines around, but we want to return true
  // either way to prevent the event's default behavior.
  event.preventDefault();
  event.stopPropagation(); // required to stop cursor movement under Firefox

  const linebreak = arrowIsUp
    ? start.getPreviousSibling()
    : end.getNextSibling();
  if (!$isLineBreakNode(linebreak)) {
    return true;
  }
  const sibling = arrowIsUp
    ? linebreak.getPreviousSibling()
    : linebreak.getNextSibling();
  if (sibling == null) {
    return true;
  }
  const maybeInsertionPoint =
    $isTextNode(sibling) || $isTabNode(sibling) || $isLineBreakNode(sibling)
      ? arrowIsUp
        ? $getFirstCodeNodeOfLine(sibling)
        : $getLastCodeNodeOfLine(sibling)
      : null;
  let insertionPoint = maybeInsertionPoint != null ? maybeInsertionPoint : sibling;
  linebreak.remove();
  range.forEach((node) => node.remove());
  if (type === KEY_ARROW_UP_COMMAND) {
    range.forEach((node) => insertionPoint.insertBefore(node));
    insertionPoint.insertBefore(linebreak);
  } else {
    insertionPoint.insertAfter(linebreak);
    insertionPoint = linebreak;
    range.forEach((node) => {
      insertionPoint.insertAfter(node);
      insertionPoint = node;
    });
  }
  selection.setTextNodeRange(anchorNode as TextNode, anchorOffset, focusNode as TextNode, focusOffset);
  return true;
}

function $handleMoveTo(
  type: LexicalCommand<KeyboardEvent>,
  event: KeyboardEvent,
): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const { anchor, focus } = selection;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const isMoveToStart = type === MOVE_TO_START;

  // Ensure the selection is within the codeblock
  if (
    !$isSelectionInCode(selection) ||
    !($isTextNode(anchorNode) || $isTabNode(anchorNode)) ||
    !($isTextNode(focusNode) || $isTabNode(focusNode))
  ) {
    return false;
  }
  const focusLineNode = focusNode;
  const direction = $getCodeLineDirection(focusLineNode);
  const moveToStart = direction === 'rtl' ? !isMoveToStart : isMoveToStart;
  if (moveToStart) {
    const start = $getStartOfCodeInLine(focusLineNode, focus.offset);
    if (start !== null) {
      const { node, offset } = start;
      if ($isLineBreakNode(node)) {
        node.selectNext(0, 0);
      } else {
        selection.setTextNodeRange(node as TextNode, offset, node as TextNode, offset);
      }
    } else {
      focusLineNode.getParentOrThrow().selectStart();
    }
  } else {
    const node = $getEndOfCodeInLine(focusLineNode);
    (node as TextNode).select();
  }
  event.preventDefault();
  event.stopPropagation();
  return true;
}

// ---------------------------------------------------------------------------
// Gutter
// ---------------------------------------------------------------------------

function updateCodeGutter(node: LexicalNode, editor: LexicalEditor): void {
  const codeElement = editor.getElementByKey(node.getKey());
  if (codeElement === null) {
    return;
  }
  const children = (node as ElementNode).getChildren();
  const childrenLength = children.length;
  // @ts-ignore: internal field
  if (childrenLength === codeElement.__cachedChildrenLength) {
    return;
  }
  // @ts-ignore: internal field
  codeElement.__cachedChildrenLength = childrenLength;
  let gutter = '1';
  let count = 1;
  for (let i = 0; i < childrenLength; i++) {
    if ($isLineBreakNode(children[i])) {
      gutter += '\n' + ++count;
    }
  }
  codeElement.setAttribute('data-gutter', gutter);
}

/**
 * Supplement the built-in updateCodeGutter (which sets data-gutter) with a
 * --gutter-chars CSS custom property so that CSS can adapt the gutter width
 * to the digit count of the largest line number.
 */
function updateGutterChars(key: string, editor: LexicalEditor): void {
  const element = editor.getElementByKey(key);
  if (!element) {
    return;
  }
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(key);
    if (!node || !$isElementNode(node)) {
      return;
    }
    let count = 1;
    for (const child of node.getChildren()) {
      if ($isLineBreakNode(child)) {
        count++;
      }
    }
    element.style.setProperty('--gutter-chars', String(String(count).length));
  });
}

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

function registerCodeKeyboardHandlers(editor: LexicalEditor): () => void {
  const registrations: Array<() => void> = [];

  // Gutter mutation listeners (only in non-headless mode).
  // Lexical mutation listeners match exact node types, not subclasses,
  // so we register for both CodeNode and IframeWidgetNode.
  if (!editor._headless) {
    const gutterMutationHandler = (mutations: Map<string, 'created' | 'updated' | 'destroyed'>) => {
      editor.getEditorState().read(() => {
        for (const [key, type] of mutations) {
          if (type !== 'destroyed') {
            const node = $getNodeByKey(key);
            if (node !== null) {
              updateCodeGutter(node, editor);
            }
          }
        }
      });
    };
    const gutterCharsMutationHandler = (mutations: Map<string, 'created' | 'updated' | 'destroyed'>) => {
      for (const [key, type] of mutations) {
        if (type !== 'destroyed') {
          updateGutterChars(key, editor);
        }
      }
    };
    registrations.push(
      editor.registerMutationListener(CodeNode, gutterMutationHandler, { skipInitialization: false }),
      editor.registerMutationListener(IframeWidgetNode, gutterMutationHandler, { skipInitialization: false }),
      editor.registerMutationListener(CodeNode, gutterCharsMutationHandler, { skipInitialization: false }),
      editor.registerMutationListener(IframeWidgetNode, gutterCharsMutationHandler, { skipInitialization: false }),
    );
  }

  // Command handlers
  registrations.push(
    editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const command = $handleTab(event.shiftKey);
        if (command === null) {
          return false;
        }
        event.preventDefault();
        editor.dispatchCommand(command, undefined);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      INSERT_TAB_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isSelectionInCode(selection as RangeSelection)) {
          return false;
        }
        $insertNodes([$createTabNode()]);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => $handleMultilineIndent(INDENT_CONTENT_COMMAND),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      () => $handleMultilineIndent(OUTDENT_CONTENT_COMMAND),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        const { anchor } = selection;
        const anchorNode = anchor.getNode();
        if (!$isSelectionInCode(selection)) {
          return false;
        }
        // If at the start of a code block, prevent selection from moving out
        if (
          selection.isCollapsed() &&
          anchor.offset === 0 &&
          anchorNode.getPreviousSibling() === null &&
          $isCodeNode(anchorNode.getParentOrThrow())
        ) {
          event.preventDefault();
          return true;
        }
        return $handleShiftLines(KEY_ARROW_UP_COMMAND, event);
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        const { anchor } = selection;
        const anchorNode = anchor.getNode();
        if (!$isSelectionInCode(selection)) {
          return false;
        }
        // If at the end of a code block, prevent selection from moving out
        if (
          selection.isCollapsed() &&
          anchor.offset === anchorNode.getTextContentSize() &&
          anchorNode.getNextSibling() === null &&
          $isCodeNode(anchorNode.getParentOrThrow())
        ) {
          event.preventDefault();
          return true;
        }
        return $handleShiftLines(KEY_ARROW_DOWN_COMMAND, event);
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      MOVE_TO_START,
      (event) => $handleMoveTo(MOVE_TO_START, event),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      MOVE_TO_END,
      (event) => $handleMoveTo(MOVE_TO_END, event),
      COMMAND_PRIORITY_LOW,
    ),
  );

  return mergeRegister(...registrations);
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export default function CodeKeyboardPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeKeyboardHandlers(editor);
  }, [editor]);

  return null;
}
