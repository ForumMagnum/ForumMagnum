import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createParagraphNode,
  $isParagraphNode,
  type BaseSelection
} from 'lexical';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { useEffect } from 'react';
import { HR } from '../../../lexical/plugins/MarkdownTransformers';

export function $getTopLevelParagraphForHR(selection: BaseSelection | null) {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();
  const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
  if (!$isParagraphNode(element)) {
    return null;
  }
  return element;
}

export default function HorizontalRuleEnterPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        let shouldHandle = false;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          const paragraphElement = $getTopLevelParagraphForHR(selection);
          if (!paragraphElement) {
            return;
          }

          const textContent = paragraphElement.getTextContent();
          if (HR.regExp.test(textContent)) {
            shouldHandle = true;
          }
        });

        if (!shouldHandle) {
          return false;
        }

        editor.update(() => {
          const selection = $getSelection();
          const paragraphElement = $getTopLevelParagraphForHR(selection);
          if (!paragraphElement) {
            return;
          }

          const hr = $createHorizontalRuleNode();
          const nextSibling = paragraphElement.getNextSibling();

          if (nextSibling !== null) {
            paragraphElement.replace(hr);
            const paragraph = $createParagraphNode();
            hr.insertAfter(paragraph);
            paragraph.select();
          } else {
            paragraphElement.insertBefore(hr);
            paragraphElement.clear();
            paragraphElement.select();
          }
        });

        event?.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
