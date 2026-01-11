"use client";

import { createCommand, LexicalCommand } from 'lexical';

/**
 * Command to set the editing mode (editing vs suggesting)
 */
export const SET_SUGGESTING_MODE_COMMAND: LexicalCommand<boolean> = createCommand(
  'SET_SUGGESTING_MODE_COMMAND'
);

/**
 * Command to accept a suggestion by ID
 */
export const ACCEPT_SUGGESTION_COMMAND: LexicalCommand<{ suggestionId: string }> = createCommand(
  'ACCEPT_SUGGESTION_COMMAND'
);

/**
 * Command to reject a suggestion by ID
 */
export const REJECT_SUGGESTION_COMMAND: LexicalCommand<{ suggestionId: string }> = createCommand(
  'REJECT_SUGGESTION_COMMAND'
);

/**
 * Command to navigate to a suggestion (scroll into view and select)
 */
export const NAVIGATE_TO_SUGGESTION_COMMAND: LexicalCommand<{ suggestionId: string }> = createCommand(
  'NAVIGATE_TO_SUGGESTION_COMMAND'
);
