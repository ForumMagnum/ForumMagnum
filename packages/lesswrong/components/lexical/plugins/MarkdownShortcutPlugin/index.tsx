/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX, useEffect } from 'react';

import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COLLABORATION_TAG,
  HISTORIC_TAG,
} from 'lexical';
import {$isCodeNode} from '@lexical/code';

import {EQUATION, PLAYGROUND_SHORTCUT_TRANSFORMERS} from '../MarkdownTransformers';
import {
  $createMathNode,
} from '@/components/editor/lexicalPlugins/math/MathNode';

const EQUATION_REGEX = /\$(\S[^$]*?\S|\S)\$$/;

function useEquationShortcut() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({tags, dirtyLeaves, editorState, prevEditorState}) => {
      if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG)) {
        return;
      }
      if (editor.isComposing()) {
        return;
      }

      const selection = editorState.read($getSelection);
      const prevSelection = prevEditorState.read($getSelection);

      if (
        !$isRangeSelection(prevSelection) ||
        !$isRangeSelection(selection) ||
        !selection.isCollapsed() ||
        selection.is(prevSelection)
      ) {
        return;
      }

      const anchorKey = selection.anchor.key;
      const anchorOffset = selection.anchor.offset;

      if (!dirtyLeaves.has(anchorKey)) {
        return;
      }

      editorState.read(() => {
        const anchorNode = $getNodeByKey(anchorKey);
        if (
          !$isTextNode(anchorNode) ||
          anchorNode.hasFormat('code') ||
          (anchorOffset !== 1 && anchorOffset > prevSelection.anchor.offset + 1)
        ) {
          return;
        }

        let textContent = anchorNode.getTextContent();
        if (textContent[anchorOffset - 1] !== EQUATION.trigger) {
          return;
        }

        if (anchorOffset < textContent.length) {
          textContent = textContent.slice(0, anchorOffset);
        }

        const match = textContent.match(EQUATION_REGEX);
        if (!match) {
          return;
        }

        const parentNode = anchorNode.getParent();
        if (parentNode === null || $isCodeNode(parentNode)) {
          return;
        }

        const startIndex = match.index ?? 0;
        const endIndex = startIndex + match[0].length;
        const equation = match[1];

        editor.update(() => {
          const currentNode = $getNodeByKey(anchorKey);
          if (!$isTextNode(currentNode)) {
            return;
          }

          let replaceNode;
          if (startIndex === 0) {
            [replaceNode] = currentNode.splitText(endIndex);
          } else {
            [, replaceNode] = currentNode.splitText(startIndex, endIndex);
          }
          replaceNode.selectNext(0, 0);

          const equationNode = $createMathNode(equation, true);
          replaceNode.replace(equationNode);
        }, {tag: 'history-push'});
      });
    });
  }, [editor]);
}

export default function MarkdownPlugin(): JSX.Element {
  useEquationShortcut();
  return <MarkdownShortcutPlugin transformers={PLAYGROUND_SHORTCUT_TRANSFORMERS} />;
}
