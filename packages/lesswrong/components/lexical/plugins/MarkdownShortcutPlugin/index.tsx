/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, type JSX } from 'react';

import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';


import {PLAYGROUND_TRANSFORMERS} from '../MarkdownTransformers';
import { registerLineBreakElementShortcuts } from './lineBreakElementShortcuts';

export default function MarkdownPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerLineBreakElementShortcuts(editor, PLAYGROUND_TRANSFORMERS), [editor]);
  return <MarkdownShortcutPlugin transformers={PLAYGROUND_TRANSFORMERS} />;
}
