'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot, mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $isLineBreakNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
  $createTextNode,
} from 'lexical';
import {useEffect} from 'react';
import {useMessages} from '@/components/common/withMessages';

import {$createIframeWidgetNode, IframeWidgetNode} from './IframeWidgetNode';

export const INSERT_IFRAME_WIDGET_COMMAND: LexicalCommand<string | undefined> = createCommand(
  'INSERT_IFRAME_WIDGET_COMMAND',
);

// Local version of updateCodeGutter from @lexical/code (not exported).
// Sets the data-gutter attribute used by CSS ::before to render line numbers.
function updateIframeWidgetGutter(node: IframeWidgetNode, editor: LexicalEditor): void {
  // editor.getElementByKey returns the wrapper (outermost element from createDOM).
  // Gutter attributes go on the inner container where the ::before pseudo-element lives.
  const wrapper = editor.getElementByKey(node.getKey());
  if (wrapper === null) {
    return;
  }
  const container = wrapper.querySelector('.iframe-widget-container') as HTMLElement | null;
  if (container === null) {
    return;
  }

  const children = node.getChildren();
  const childrenLength = children.length;

  let gutter = '1';
  let count = 1;
  for (let i = 0; i < childrenLength; i++) {
    if ($isLineBreakNode(children[i])) {
      gutter += '\n' + String(++count);
    }
  }

  container.setAttribute('data-gutter', gutter);
  // Set the digit count so CSS can compute gutter width dynamically.
  // Uses the `ch` unit (width of "0" in the current monospace font).
  container.style.setProperty('--gutter-chars', String(String(count).length));
}

export default function IframeWidgetPlugin({ isSuggestionMode }: { isSuggestionMode?: boolean }): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const { flash } = useMessages();

  useEffect(() => {
    if (!editor.hasNodes([IframeWidgetNode])) {
      throw new Error(
        'IframeWidgetPlugin: IframeWidgetNode not registered on editor',
      );
    }

    return mergeRegister(
      editor.registerCommand<string | undefined>(
        INSERT_IFRAME_WIDGET_COMMAND,
        (payload) => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Iframe widgets are not supported in suggestion mode',
              type: 'error',
            });
            return true;
          }
          const node = $createIframeWidgetNode();
          if (payload) {
            node.append($createTextNode(payload));
          }
          $insertNodeToNearestRoot(node);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      // Register a mutation listener for gutter updates. registerCodeHighlighting
      // only listens for CodeNode (type 'code'), not our custom type 'iframe-widget'.
      editor.registerMutationListener(IframeWidgetNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type !== 'destroyed') {
              const node = $getNodeByKey(key);
              if (node instanceof IframeWidgetNode) {
                updateIframeWidgetGutter(node, editor);
              }
            }
          }
        });
      }, {skipInitialization: false}),
    );
  }, [editor, isSuggestionMode, flash]);

  return null;
}
