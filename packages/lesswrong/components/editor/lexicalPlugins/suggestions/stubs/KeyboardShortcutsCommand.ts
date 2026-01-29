import { createCommand } from 'lexical';

export const KEYBOARD_SHORTCUT_COMMAND = createCommand<{ event: KeyboardEvent; shortcut: string }>(
  'SUGGESTION_STUB_KEYBOARD_SHORTCUT_COMMAND',
);
