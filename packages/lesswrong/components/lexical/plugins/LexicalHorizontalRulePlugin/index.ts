/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createHorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '@lexical/extension';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical';
import {useEffect} from 'react';

export function HorizontalRulePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND,
      (type) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const focusNode = selection.focus.getNode();

        if (focusNode === null) {
          return true;
        }

        // If the cursor is collapsed inside an empty top-level paragraph,
        // replace that paragraph with the HR + a new trailing paragraph
        // instead of falling through to `$insertNodeToNearestRoot`, which
        // splits the empty paragraph in half and leaves an undeletable
        // empty paragraph before the HR.
        //
        // The specific symptom of that bug is "insert a divider after an
        // image leaves an extra space you can't delete": the image plugin
        // auto-inserts a trailing empty paragraph after every image, so the
        // user's cursor lands there, and after the HR insertion the leftover
        // empty paragraph sits between the image (a shadow root that can't
        // be merged into via Backspace) and the HR, with no way to remove
        // it. This path also avoids leaving a ghost paragraph for the
        // general "insert HR into an empty paragraph" case.
        if (selection.isCollapsed()) {
          const topLevel = focusNode.getTopLevelElement();
          const topLevelParent = topLevel?.getParent() ?? null;
          if (
            topLevel !== null &&
            $isParagraphNode(topLevel) &&
            topLevel.isEmpty() &&
            topLevelParent !== null &&
            $isRootOrShadowRoot(topLevelParent)
          ) {
            const horizontalRuleNode = $createHorizontalRuleNode();
            const trailingParagraph = $createParagraphNode();
            topLevel.insertBefore(horizontalRuleNode);
            horizontalRuleNode.insertAfter(trailingParagraph);
            topLevel.remove();
            trailingParagraph.select();
            return true;
          }
        }

        const horizontalRuleNode = $createHorizontalRuleNode();
        $insertNodeToNearestRoot(horizontalRuleNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
