'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createLWArtifactsNode, LWArtifactsNode} from './LWArtifactsNode';

export const INSERT_LWARTIFACTS_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_LWARTIFACTS_COMMAND',
);

export default function LWArtifactsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([LWArtifactsNode])) {
      throw new Error(
        'LWArtifactsPlugin: LWArtifactsNode not registered on editor',
      );
    }

    return editor.registerCommand<string>(
      INSERT_LWARTIFACTS_COMMAND,
      (payload) => {
        const lwartifactsNode = $createLWArtifactsNode(payload);
        $insertNodeToNearestRoot(lwartifactsNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
