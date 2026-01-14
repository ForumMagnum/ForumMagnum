'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createEstimakerNode, EstimakerNode} from './EstimakerNode';

export const INSERT_ESTIMAKER_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_ESTIMAKER_COMMAND',
);

export default function EstimakerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EstimakerNode])) {
      throw new Error('EstimakerPlugin: EstimakerNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_ESTIMAKER_COMMAND,
      (payload) => {
        const estimakerNode = $createEstimakerNode(payload);
        $insertNodeToNearestRoot(estimakerNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
