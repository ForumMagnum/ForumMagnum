'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createViewpointsNode, ViewpointsNode} from './ViewpointsNode';

export const INSERT_VIEWPOINTS_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_VIEWPOINTS_COMMAND',
);

export default function ViewpointsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ViewpointsNode])) {
      throw new Error('ViewpointsPlugin: ViewpointsNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_VIEWPOINTS_COMMAND,
      (payload) => {
        const viewpointsNode = $createViewpointsNode(payload);
        $insertNodeToNearestRoot(viewpointsNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
