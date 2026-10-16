'use client';
import { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createVideoFileNode, VideoFileNode} from './VideoFileNode';

export const INSERT_VIDEO_FILE_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_VIDEO_FILE_COMMAND',
);

export default function VideoFilePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VideoFileNode])) {
      throw new Error('VideoFilePlugin: VideoFileNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_VIDEO_FILE_COMMAND,
      (payload) => {
        const videoFileNode = $createVideoFileNode(payload);
        $insertNodeToNearestRoot(videoFileNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
