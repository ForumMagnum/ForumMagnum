'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createMetaforecastNode, MetaforecastNode} from './MetaforecastNode';

export const INSERT_METAFORECAST_COMMAND: LexicalCommand<string> =
  createCommand('INSERT_METAFORECAST_COMMAND');

export default function MetaforecastPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MetaforecastNode])) {
      throw new Error(
        'MetaforecastPlugin: MetaforecastNode not registered on editor',
      );
    }

    return editor.registerCommand<string>(
      INSERT_METAFORECAST_COMMAND,
      (payload) => {
        const metaforecastNode = $createMetaforecastNode(payload);
        $insertNodeToNearestRoot(metaforecastNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
