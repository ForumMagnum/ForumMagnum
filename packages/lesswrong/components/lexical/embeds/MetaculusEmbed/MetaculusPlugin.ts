'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createMetaculusNode, MetaculusNode} from './MetaculusNode';

export const INSERT_METACULUS_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_METACULUS_COMMAND',
);

export default function MetaculusPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MetaculusNode])) {
      throw new Error('MetaculusPlugin: MetaculusNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_METACULUS_COMMAND,
      (payload) => {
        const metaculusNode = $createMetaculusNode(payload);
        $insertNodeToNearestRoot(metaculusNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
