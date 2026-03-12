'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createCalendlyNode, CalendlyNode} from './CalendlyNode';

export const INSERT_CALENDLY_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_CALENDLY_COMMAND',
);

export default function CalendlyPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CalendlyNode])) {
      throw new Error('CalendlyPlugin: CalendlyNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_CALENDLY_COMMAND,
      (payload) => {
        const calendlyNode = $createCalendlyNode(payload);
        $insertNodeToNearestRoot(calendlyNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
