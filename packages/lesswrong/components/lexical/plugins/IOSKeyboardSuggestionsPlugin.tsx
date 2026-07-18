"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isDecoratorNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_BEFORE_EDITOR,
  KEY_BACKSPACE_COMMAND,
  type LexicalEditor,
  type RangeSelection,
} from "lexical";
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils";
import { CAN_USE_BEFORE_INPUT, IS_IOS } from "@/lib/vendor/lexical-shared/environment";

interface IOSKeyboardEnvironment {
  isIOS: boolean;
  canUseBeforeInput: boolean;
}

const defaultEnvironment: IOSKeyboardEnvironment = {
  isIOS: IS_IOS,
  canUseBeforeInput: CAN_USE_BEFORE_INPUT,
};

function $isSelectionCollapsedAtFrontOfIndentedBlock(selection: RangeSelection): boolean {
  if (!selection.isCollapsed() || selection.anchor.offset !== 0) {
    return false;
  }

  const anchorNode = selection.anchor.getNode();
  if ($isRootNode(anchorNode)) {
    return false;
  }

  const element = $getNearestBlockElementAncestorOrThrow(anchorNode);
  return (
    element.getIndent() > 0 &&
    (element.is(anchorNode) || anchorNode.is(element.getFirstDescendant()))
  );
}

/**
 * Backports facebook/lexical#8725 until ForumMagnum upgrades past Lexical
 * 0.44. On iOS, preventing the Backspace keydown suppresses the native
 * beforeinput event that keeps swipe typing and autocorrect in sync.
 */
export function registerIOSKeyboardSuggestions(
  editor: LexicalEditor,
  environment: IOSKeyboardEnvironment = defaultEnvironment,
): () => void {
  return editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    (event) => {
      if (!environment.isIOS || !environment.canUseBeforeInput) {
        return false;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      const target = event.target;
      const NodeConstructor = editor.getRootElement()?.ownerDocument.defaultView?.Node;
      if (
        target &&
        NodeConstructor &&
        target instanceof NodeConstructor &&
        $isDecoratorNode($getNearestNodeFromDOMNode(target))
      ) {
        return false;
      }

      // Preserve the rich-text handler's special outdent behavior.
      if ($isSelectionCollapsedAtFrontOfIndentedBlock(selection)) {
        return false;
      }

      // Consume the Lexical command without preventing the browser event.
      // Native beforeinput will perform the deletion and update QuickPath.
      return true;
    },
    COMMAND_PRIORITY_BEFORE_EDITOR,
  );
}

export default function IOSKeyboardSuggestionsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerIOSKeyboardSuggestions(editor), [editor]);

  return null;
}
