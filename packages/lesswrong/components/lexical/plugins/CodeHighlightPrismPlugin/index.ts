/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import { registerCodeHighlighting } from '@lexical/code';
import { CodeNode } from '@/lib/vendor/lexical/CodeNode';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$getNodeByKey, $isElementNode, $isLineBreakNode, LexicalEditor} from 'lexical';
import {useEffect} from 'react';
import { mergeRegister } from '@lexical/utils';

// Supplement the built-in updateCodeGutter (which sets data-gutter) with a
// --gutter-chars CSS custom property so that CSS can adapt the gutter width
// to the digit count of the largest line number.
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

export default function CodeHighlightPrismPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      registerCodeHighlighting(editor),
      editor.registerMutationListener(CodeNode, (mutations) => {
        for (const [key, type] of mutations) {
          if (type !== 'destroyed') {
            updateGutterChars(key, editor);
          }
        }
      }, {skipInitialization: false}),
    );
  }, [editor]);

  return null;
}
