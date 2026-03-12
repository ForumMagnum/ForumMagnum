'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createThoughtsaverNode, ThoughtsaverNode} from './ThoughtsaverNode';

export const INSERT_THOUGHTSAVER_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_THOUGHTSAVER_COMMAND',
);

export default function ThoughtsaverPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ThoughtsaverNode])) {
      throw new Error(
        'ThoughtsaverPlugin: ThoughtsaverNode not registered on editor',
      );
    }

    return editor.registerCommand<string>(
      INSERT_THOUGHTSAVER_COMMAND,
      (payload) => {
        const thoughtsaverNode = $createThoughtsaverNode(payload);
        $insertNodeToNearestRoot(thoughtsaverNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
