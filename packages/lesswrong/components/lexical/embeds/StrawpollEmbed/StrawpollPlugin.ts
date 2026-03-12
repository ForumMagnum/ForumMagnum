'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createStrawpollNode, StrawpollNode} from './StrawpollNode';

export const INSERT_STRAWPOLL_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_STRAWPOLL_COMMAND',
);

export default function StrawpollPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([StrawpollNode])) {
      throw new Error('StrawpollPlugin: StrawpollNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_STRAWPOLL_COMMAND,
      (payload) => {
        const strawpollNode = $createStrawpollNode(payload);
        $insertNodeToNearestRoot(strawpollNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
