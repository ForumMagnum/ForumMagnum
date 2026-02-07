'use client';

import React, { type JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';

import {
  $createReviewResultsTableNode,
  ReviewResultsTableNode,
} from './ReviewResultsTableNode';
import type { ReviewResultsEntry } from '@/components/contents/ReviewResultsTableDisplay';

export interface ReviewResultsPayload {
  year: number;
  results: ReviewResultsEntry[];
}

export const INSERT_REVIEW_RESULTS_COMMAND: LexicalCommand<ReviewResultsPayload> = createCommand(
  'INSERT_REVIEW_RESULTS_COMMAND',
);

export default function ReviewResultsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ReviewResultsTableNode])) {
      throw new Error('ReviewResultsPlugin: ReviewResultsTableNode not registered on editor');
    }

    return editor.registerCommand<ReviewResultsPayload>(
      INSERT_REVIEW_RESULTS_COMMAND,
      (payload) => {
        const node = $createReviewResultsTableNode(payload.year, payload.results);
        $insertNodeToNearestRoot(node);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
