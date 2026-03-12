"use client";

import React, { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useDialog } from '@/components/common/withDialog';
import CreateClaimDialog from '@/components/editor/claims/CreateClaimDialog';
import { ClaimNode, $createClaimNode } from './ClaimNode';

export const INSERT_CLAIM_COMMAND: LexicalCommand<string> = createCommand('INSERT_CLAIM_COMMAND');

/**
 * Plugin for embedding claims/predictions in the editor.
 * 
 * Features:
 * - Insert claim elements with unique IDs
 * - Renders as prediction widgets in the editor
 * - Exports as <div class="elicit-binary-prediction" data-elicit-id="...">
 */
export function ClaimsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register the ClaimNode if not already registered
    if (!editor.hasNodes([ClaimNode])) {
      throw new Error('ClaimsPlugin: ClaimNode not registered on editor');
    }

    return mergeRegister(
      // Handle INSERT_CLAIM_COMMAND with a claim ID
      editor.registerCommand(
        INSERT_CLAIM_COMMAND,
        (claimId: string) => {
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const claimNode = $createClaimNode(claimId);
            selection.insertNodes([claimNode]);
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  return null;
}

/**
 * Hook to get a function that opens the claim creation dialog and inserts a claim
 */
export function useInsertClaim() {
  const [editor] = useLexicalComposerContext();
  const { openDialog } = useDialog();

  const insertClaim = useCallback(() => {
    // Get selected text to use as initial title
    let selectedText = '';
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selectedText = selection.getTextContent();
      }
    });

    openDialog({
      name: "CreateClaimDialog",
      contents: ({ onClose }) => (
        <CreateClaimDialog
          onClose={onClose}
          initialTitle={selectedText}
          onSubmit={(claim) => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                // Remove selected text and insert claim
                selection.removeText();
                const claimNode = $createClaimNode(claim._id);
                selection.insertNodes([claimNode]);
              }
            });
          }}
          onCancel={() => {
            // Do nothing
          }}
        />
      ),
    });
  }, [editor, openDialog]);

  return insertClaim;
}

export default ClaimsPlugin;
