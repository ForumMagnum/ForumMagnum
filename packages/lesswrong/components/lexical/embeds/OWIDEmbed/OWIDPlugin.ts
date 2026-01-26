'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createOWIDNode, OWIDNode} from './OWIDNode';

export const INSERT_OWID_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_OWID_COMMAND',
);

export default function OWIDPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([OWIDNode])) {
      throw new Error('OWIDPlugin: OWIDNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_OWID_COMMAND,
      (payload) => {
        const owidNode = $createOWIDNode(payload);
        $insertNodeToNearestRoot(owidNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
