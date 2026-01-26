'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createManifoldNode, ManifoldNode} from './ManifoldNode';

export const INSERT_MANIFOLD_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_MANIFOLD_COMMAND',
);

export default function ManifoldPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ManifoldNode])) {
      throw new Error('ManifoldPlugin: ManifoldNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_MANIFOLD_COMMAND,
      (payload) => {
        const manifoldNode = $createManifoldNode(payload);
        $insertNodeToNearestRoot(manifoldNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
