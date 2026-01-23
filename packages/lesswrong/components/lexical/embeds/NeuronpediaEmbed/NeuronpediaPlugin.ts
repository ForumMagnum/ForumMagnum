'use client';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createNeuronpediaNode, NeuronpediaNode} from './NeuronpediaNode';

export const INSERT_NEURONPEDIA_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_NEURONPEDIA_COMMAND',
);

export default function NeuronpediaPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([NeuronpediaNode])) {
      throw new Error(
        'NeuronpediaPlugin: NeuronpediaNode not registered on editor',
      );
    }

    return editor.registerCommand<string>(
      INSERT_NEURONPEDIA_COMMAND,
      (payload) => {
        const neuronpediaNode = $createNeuronpediaNode(payload);
        $insertNodeToNearestRoot(neuronpediaNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
