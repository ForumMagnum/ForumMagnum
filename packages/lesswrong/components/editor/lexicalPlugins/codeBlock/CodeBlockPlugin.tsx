"use client";

import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import {
  $createTextNode,
  $findMatchingParent,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  KEY_DOWN_COMMAND,
  $isRootNode,
  SELECT_ALL_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
} from "lexical";
import { SET_BLOCK_TYPE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils';
import { useEffect } from "react";

/**
 * Inserts a block-level code node (Lexical's built-in CodeNode).
 *
 * Note: Inline code formatting is handled separately via FORMAT_TEXT_COMMAND + 'code'.
 */
export const INSERT_CODE_BLOCK_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_CODE_BLOCK_COMMAND",
);

function tryConvertTripleBackticksToCodeBlockInUpdateContext(): boolean {
  const selection = $getSelection();
  if (!selection || !$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }

  const anchorNode = selection.anchor.getNode();
  if ($isRootNode(anchorNode)) {
    return false;
  }
  const block = anchorNode.getTopLevelElementOrThrow();
  const text = block.getTextContent();
  // Allow optional language (```js, ```python, etc)
  if (!/^```[\w-]*$/.test(text)) {
    return false;
  }

  const language = text.length > 3 ? text.slice(3) : undefined;
  const codeNode = $createCodeNode(language);
  // Ensure the code block starts with a single empty line.
  codeNode.append($createTextNode(""));
  block.replace(codeNode);
  codeNode.select(0, 0);
  return true;
}

function insertCodeBlock(editor: LexicalEditor): void {
  if (editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, 'code')) {
    return;
  }
  editor.update(() => {
    let selection = $getSelection();
    if (!selection) return;
    if (!$isRangeSelection(selection)) return;

    if (selection.isCollapsed()) {
      $setBlocksType(selection, () => $createCodeNode());
      return;
    }

    const textContent = selection.getTextContent();
    const codeNode = $createCodeNode();
    selection.insertNodes([codeNode]);
    selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.insertRawText(textContent);
    }
  });
}

/**
 * When Cmd+A (or Ctrl+A) is pressed while the selection is inside a CodeNode
 * (including IframeWidgetNode, which extends CodeNode), select only the
 * contents of that code block instead of the entire editor.
 *
 * If the code block is already fully selected, a subsequent Cmd+A falls
 * through to the default handler which selects the whole editor.
 */
function $handleSelectAllInCodeBlock(): boolean {
  const selection = $getSelection();
  if (!selection || !$isRangeSelection(selection)) {
    return false;
  }

  const anchorNode = selection.anchor.getNode();
  const codeNode = $isCodeNode(anchorNode)
    ? anchorNode
    : $findMatchingParent(anchorNode, $isCodeNode);

  if (!codeNode) {
    return false;
  }

  // Also verify the focus is in the same code node — if the user has
  // a cross-block selection we shouldn't interfere.
  const focusNode = selection.focus.getNode();
  const focusCodeNode = $isCodeNode(focusNode)
    ? focusNode
    : $findMatchingParent(focusNode, $isCodeNode);

  if (focusCodeNode !== codeNode) {
    return false;
  }

  // Check if the entire code block is already selected. If so, let the
  // default handler expand the selection to the whole editor.
  const selectedText = selection.getTextContent();
  const codeText = codeNode.getTextContent();
  if (selectedText === codeText) {
    return false;
  }

  // Select all content within the code block.
  codeNode.select(0, codeNode.getChildrenSize());
  return true;
}

export function registerCodeBlockPlugin(editor: LexicalEditor): () => void {
  const removeInsertCommand = editor.registerCommand(
      INSERT_CODE_BLOCK_COMMAND,
      () => {
        insertCodeBlock(editor);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

  // Intercept Enter at keydown level so we always have the KeyboardEvent and can
  // prevent Lexical's default paragraph insertion.
  const removeTripleBackticksKeyDown = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (
          event.key !== "Enter" ||
          event.shiftKey ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        ) {
          return false;
        }
        if (editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, 'code')) {
          return false;
        }
        const didConvert = tryConvertTripleBackticksToCodeBlockInUpdateContext();
        if (didConvert) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

  const removeSelectAll = editor.registerCommand(
      SELECT_ALL_COMMAND,
      (_event) => $handleSelectAllInCodeBlock(),
      COMMAND_PRIORITY_HIGH,
    );

  return () => {
    removeInsertCommand();
    removeTripleBackticksKeyDown();
    removeSelectAll();
  };
}

export function CodeBlockPlugin({ editor }: { editor: LexicalEditor }) {
  useEffect(() => {
    return registerCodeBlockPlugin(editor);
  }, [editor]);

  return null;
}

