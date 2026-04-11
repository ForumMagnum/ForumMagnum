/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {$createCodeNode} from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $createListItemNode,
  $createListNode,
} from '@lexical/list';
import {$isDecoratorBlockNode} from '@lexical/react/LexicalDecoratorBlockNode';
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {$patchStyleText, $setBlocksType} from '@lexical/selection';
import {$isTableSelection} from '@lexical/table';
import {$findMatchingParent, $getNearestBlockElementAncestorOrThrow} from '@lexical/utils';
import {
  $addUpdateTag,
  $createParagraphNode,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  type ElementNode,
  LexicalEditor,
  type LexicalNode,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
} from 'lexical';
import type { BlockType } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils';
import { SET_BLOCK_TYPE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils';
import { $isContainerQuoteNode, $wrapInQuote, $unwrapQuote } from '@/components/editor/lexicalPlugins/quote/ContainerQuoteNode';

import {
  DEFAULT_FONT_SIZE,
  MAX_ALLOWED_FONT_SIZE,
  MIN_ALLOWED_FONT_SIZE,
} from '../../context/ToolbarContext';

// eslint-disable-next-line no-shadow
export enum UpdateFontSizeType {
  increment = 1,
  decrement,
}

const $isNonInlineBlockElement = (node: LexicalNode): node is ElementNode =>
  $isElementNode(node) && !node.isInline();

/**
 * Returns true iff the given (non-collapsed) RangeSelection is "simple enough"
 * that selection.insertNodes([codeNode]) can reliably wrap just the selected
 * text in a single new code block.
 *
 * The rejected cases are the ones that trigger Lexical error #66 in the code
 * block path: selections that span multiple top-level blocks (so removeText
 * has to split and merge across boundaries) and selections that include a
 * decorator node (image, widget, math, etc.) whose removal can leave another
 * node orphaned during the subsequent insertParagraph / findMatchingParent
 * pass.
 */
function $isSafeForCodeBlockInsertNodes(
  selection: ReturnType<typeof $getSelection>,
): boolean {
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const anchorBlock = $findMatchingParent(
    selection.anchor.getNode(),
    $isNonInlineBlockElement,
  );
  const focusBlock = $findMatchingParent(
    selection.focus.getNode(),
    $isNonInlineBlockElement,
  );
  if (!$isElementNode(anchorBlock) || !$isElementNode(focusBlock)) {
    return false;
  }
  if (!anchorBlock.is(focusBlock)) {
    return false;
  }
  for (const node of selection.getNodes()) {
    if ($isDecoratorNode(node) || $isDecoratorBlockNode(node)) {
      return false;
    }
  }
  return true;
}

export const applyBlockTypeChange = (
  editor: LexicalEditor,
  blockType: BlockType,
) => {
  const handled = editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, blockType);
  if (handled) {
    return;
  }
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
    const selection = $getSelection();
    if (!selection) {
      return;
    }
    if (blockType === 'paragraph') {
      $setBlocksType(selection, () => $createParagraphNode());
      return;
    }
    if (blockType === 'quote') {
      $wrapOrUnwrapQuote(selection);
      return;
    }
    if (blockType === 'code') {
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        $setBlocksType(selection, () => $createCodeNode());
        return;
      }
      // Range selection: prefer wrapping only the selected text in a single
      // new code block via selection.insertNodes. That path is fragile --
      // when the selection spans multiple top-level blocks or contains a
      // decorator node (image, widget, math, etc.), Lexical's internal
      // removeText/insertParagraph sequence can orphan a node and throw
      // Lexical error #66 ("Expected node to have a parent"), which aborts
      // the update and leaves the user's click doing nothing (visible in
      // Sentry as a crash in ToolbarPlugin/utils.ts line 80, triggered from
      // the floating format toolbar's code button).
      //
      // Detect those cases upfront and fall back to $setBlocksType, which
      // converts each touched top-level block into its own code block. The
      // result is a slightly different shape (multiple code blocks instead
      // of one wrapping the selected text) but it doesn't crash.
      if (!$isSafeForCodeBlockInsertNodes(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
        return;
      }
      const textContent = selection.getTextContent();
      const codeNode = $createCodeNode();
      selection.insertNodes([codeNode]);
      const updatedSelection = $getSelection();
      if ($isRangeSelection(updatedSelection)) {
        updatedSelection.insertRawText(textContent);
      }
      return;
    }
    if (
      blockType === 'h1' ||
      blockType === 'h2' ||
      blockType === 'h3' ||
      blockType === 'h4' ||
      blockType === 'h5' ||
      blockType === 'h6'
    ) {
      $setBlocksType(selection, () => $createHeadingNode(blockType));
      return;
    }
    if (blockType === 'bullet' || blockType === 'number' || blockType === 'check') {
      const list = $createListNode(blockType);
      list.append($createListItemNode());
      $setBlocksType(selection, () => list);
    }
  });
};

/**
 * Calculates the new font size based on the update type.
 * @param currentFontSize - The current font size
 * @param updateType - The type of change, either increment or decrement
 * @returns the next font size
 */
export const calculateNextFontSize = (
  currentFontSize: number,
  updateType: UpdateFontSizeType | null,
) => {
  if (!updateType) {
    return currentFontSize;
  }

  let updatedFontSize: number = currentFontSize;
  switch (updateType) {
    case UpdateFontSizeType.decrement:
      switch (true) {
        case currentFontSize > MAX_ALLOWED_FONT_SIZE:
          updatedFontSize = MAX_ALLOWED_FONT_SIZE;
          break;
        case currentFontSize >= 48:
          updatedFontSize -= 12;
          break;
        case currentFontSize >= 24:
          updatedFontSize -= 4;
          break;
        case currentFontSize >= 14:
          updatedFontSize -= 2;
          break;
        case currentFontSize >= 9:
          updatedFontSize -= 1;
          break;
        default:
          updatedFontSize = MIN_ALLOWED_FONT_SIZE;
          break;
      }
      break;

    case UpdateFontSizeType.increment:
      switch (true) {
        case currentFontSize < MIN_ALLOWED_FONT_SIZE:
          updatedFontSize = MIN_ALLOWED_FONT_SIZE;
          break;
        case currentFontSize < 12:
          updatedFontSize += 1;
          break;
        case currentFontSize < 20:
          updatedFontSize += 2;
          break;
        case currentFontSize < 36:
          updatedFontSize += 4;
          break;
        case currentFontSize <= 60:
          updatedFontSize += 12;
          break;
        default:
          updatedFontSize = MAX_ALLOWED_FONT_SIZE;
          break;
      }
      break;

    default:
      break;
  }
  return updatedFontSize;
};

/**
 * Patches the selection with the updated font size.
 */
export const updateFontSizeInSelection = (
  editor: LexicalEditor,
  newFontSize: string | null,
  updateType: UpdateFontSizeType | null,
  skipRefocus: boolean,
) => {
  const getNextFontSize = (prevFontSize: string | null): string => {
    if (!prevFontSize) {
      prevFontSize = `${DEFAULT_FONT_SIZE}px`;
    }
    prevFontSize = prevFontSize.slice(0, -2);
    const nextFontSize = calculateNextFontSize(
      Number(prevFontSize),
      updateType,
    );
    return `${nextFontSize}px`;
  };

  editor.update(() => {
    if (skipRefocus) {
      $addUpdateTag(SKIP_DOM_SELECTION_TAG);
    }
    if (editor.isEditable()) {
      const selection = $getSelection();
      if (selection !== null) {
        $patchStyleText(selection, {
          'font-size': newFontSize || getNextFontSize,
        });
      }
    }
  });
};

export const updateFontSize = (
  editor: LexicalEditor,
  updateType: UpdateFontSizeType,
  inputValue: string,
  skipRefocus: boolean = false,
) => {
  if (inputValue !== '') {
    const nextFontSize = calculateNextFontSize(Number(inputValue), updateType);
    updateFontSizeInSelection(
      editor,
      String(nextFontSize) + 'px',
      null,
      skipRefocus,
    );
  } else {
    updateFontSizeInSelection(editor, null, updateType, skipRefocus);
  }
};

/**
 * Wraps the selected block(s) in a ContainerQuoteNode, or unwraps them if
 * already inside a quote.
 *
 * For wrapping: finds the top-level element(s) from the selection and moves
 * them into a new ContainerQuoteNode.
 *
 * For unwrapping: moves the quote's children out after the quote and removes
 * the empty quote node.
 */
function $wrapOrUnwrapQuote(selection: ReturnType<typeof $getSelection>): void {
  if (!$isRangeSelection(selection)) {
    return;
  }

  const anchorNode = selection.anchor.getNode();

  // Check if we're already inside a quote
  const existingQuote = $findMatchingParent(anchorNode, $isContainerQuoteNode);
  if (existingQuote) {
    $unwrapQuote(existingQuote);
    return;
  }

  // Wrap: find the top-level element(s) in the selection and wrap in a quote
  const nodes = selection.getNodes();
  // Collect unique top-level block elements
  const topLevelElements = new Set<import('lexical').LexicalNode>();
  for (const node of nodes) {
    const topLevel = $findMatchingParent(node, (n) => {
      const parent = n.getParent();
      return parent !== null && $isRootOrShadowRoot(parent);
    });
    if (topLevel) {
      topLevelElements.add(topLevel);
    }
  }

  if (topLevelElements.size === 0) {
    return;
  }

  // Sort by position in the document
  const sortedElements = Array.from(topLevelElements).sort((a, b) => {
    return a.isBefore(b) ? -1 : 1;
  });

  $wrapInQuote(sortedElements);
}

export const formatParagraph = (editor: LexicalEditor) => {
  applyBlockTypeChange(editor, 'paragraph');
};

export const formatHeading = (
  editor: LexicalEditor,
  blockType: string,
  headingSize: HeadingTagType,
) => {
  if (blockType !== headingSize) {
    applyBlockTypeChange(editor, headingSize);
  }
};

export const formatBulletList = (editor: LexicalEditor, blockType: string) => {
  if (blockType !== 'bullet') {
    editor.update(() => {
      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    });
  } else {
    formatParagraph(editor);
  }
};

export const formatCheckList = (editor: LexicalEditor, blockType: string) => {
  if (blockType !== 'check') {
    editor.update(() => {
      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    });
  } else {
    formatParagraph(editor);
  }
};

export const formatNumberedList = (
  editor: LexicalEditor,
  blockType: string,
) => {
  if (blockType !== 'number') {
    editor.update(() => {
      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    });
  } else {
    formatParagraph(editor);
  }
};

export const formatQuote = (editor: LexicalEditor, blockType: string) => {
  // With ContainerQuoteNode as a shadow root, this is always a toggle
  // (wrap/unwrap), regardless of the current block type.
  applyBlockTypeChange(editor, 'quote');
};

export const formatCode = (editor: LexicalEditor, blockType: string) => {
  if (blockType !== 'code') {
    applyBlockTypeChange(editor, 'code');
  }
};

export const clearFormatting = (
  editor: LexicalEditor,
  skipRefocus: boolean = false,
) => {
  editor.update(() => {
    if (skipRefocus) {
      $addUpdateTag(SKIP_DOM_SELECTION_TAG);
    }
    const selection = $getSelection();
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const anchor = selection.anchor;
      const focus = selection.focus;
      const nodes = selection.getNodes();
      const extractedNodes = selection.extract();

      if (anchor.key === focus.key && anchor.offset === focus.offset) {
        return;
      }

      nodes.forEach((node, idx) => {
        // We split the first and last node by the selection
        // So that we don't format unselected text inside those nodes
        if ($isTextNode(node)) {
          // Use a separate variable to ensure TS does not lose the refinement
          let textNode = node;
          if (idx === 0 && anchor.offset !== 0) {
            textNode = textNode.splitText(anchor.offset)[1] || textNode;
          }
          if (idx === nodes.length - 1) {
            textNode = textNode.splitText(focus.offset)[0] || textNode;
          }
          /**
           * If the selected text has one format applied
           * selecting a portion of the text, could
           * clear the format to the wrong portion of the text.
           *
           * The cleared text is based on the length of the selected text.
           */
          // We need this in case the selected text only has one format
          const extractedTextNode = extractedNodes[0];
          if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
            textNode = extractedTextNode;
          }

          if (textNode.__style !== '') {
            textNode.setStyle('');
          }
          if (textNode.__format !== 0) {
            textNode.setFormat(0);
          }
          const nearestBlockElement =
            $getNearestBlockElementAncestorOrThrow(textNode);
          if (nearestBlockElement.__format !== 0) {
            nearestBlockElement.setFormat('');
          }
          if (nearestBlockElement.__indent !== 0) {
            nearestBlockElement.setIndent(0);
          }
          node = textNode;
        } else if ($isHeadingNode(node)) {
          node.replace($createParagraphNode(), true);
        } else if ($isContainerQuoteNode(node)) {
          $unwrapQuote(node);
        } else if ($isDecoratorBlockNode(node)) {
          node.setFormat('');
        }
      });
    }
  });
};
