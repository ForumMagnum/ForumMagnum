"use client";

import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useDialog, type OpenDialogContextType } from '@/components/common/withDialog';
import CreateClaimDialog from '@/components/editor/claims/CreateClaimDialog';
import { ClaimNode, $insertClaimNode } from './ClaimNode';

/**
 * Insert a claim with the given (already-created) ElicitQuestion ID, replacing
 * the current selection.
 */
export const INSERT_CLAIM_COMMAND: LexicalCommand<string> = createCommand('INSERT_CLAIM_COMMAND');

/**
 * Open the "Create Claim" dialog, pre-filled with the selected text. On
 * submit, the new claim replaces the selection. This is the Lexical
 * equivalent of CkEditor's `insertClaim` command.
 */
export const OPEN_CREATE_CLAIM_DIALOG_COMMAND: LexicalCommand<void> = createCommand('OPEN_CREATE_CLAIM_DIALOG_COMMAND');

function openCreateClaimDialog(editor: LexicalEditor, openDialog: OpenDialogContextType['openDialog']) {
  const selectedText = editor.getEditorState().read(() => {
    const selection = $getSelection();
    return $isRangeSelection(selection) ? selection.getTextContent() : '';
  });

  openDialog({
    name: "CreateClaimDialog",
    contents: ({ onClose }) => (
      <CreateClaimDialog
        onClose={onClose}
        initialTitle={selectedText}
        onSubmit={(claim) => {
          editor.dispatchCommand(INSERT_CLAIM_COMMAND, claim._id);
          editor.focus();
        }}
        onCancel={() => editor.focus()}
      />
    ),
  });
}

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
  const { openDialog } = useDialog();

  useEffect(() => {
    if (!editor.hasNodes([ClaimNode])) {
      throw new Error('ClaimsPlugin: ClaimNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_CLAIM_COMMAND,
        (claimId: string) => {
          $insertClaimNode(claimId);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        OPEN_CREATE_CLAIM_DIALOG_COMMAND,
        () => {
          if (!editor.isEditable()) {
            return false;
          }
          openCreateClaimDialog(editor, openDialog);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
    );
  }, [editor, openDialog]);

  return null;
}

export default ClaimsPlugin;
