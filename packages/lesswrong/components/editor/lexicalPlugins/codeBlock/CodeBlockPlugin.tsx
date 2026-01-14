"use client";

import { $createCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  KEY_DOWN_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
} from "lexical";
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
        const didConvert = tryConvertTripleBackticksToCodeBlockInUpdateContext();
        if (didConvert) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

  return () => {
    removeInsertCommand();
    removeTripleBackticksKeyDown();
  };
}

export function CodeBlockPlugin({ editor }: { editor: LexicalEditor }) {
  useEffect(() => {
    return registerCodeBlockPlugin(editor);
  }, [editor]);

  return null;
}

