import { createCommand } from 'lexical';

// Used for inline CSS style suggestions (e.g. font-size, color) in Proton.
// We don't currently dispatch this command, but the suggestion
// handler supports it for future UI work.
export const SET_SELECTION_STYLE_PROPERTY_COMMAND = createCommand<{
  property: string;
  value: string | null;
}>('SUGGESTION_SET_SELECTION_STYLE_PROPERTY_COMMAND');

// Used for "clear formatting" in Proton's formatting UI.
// We don't currently dispatch this command.
export const CLEAR_FORMATTING_COMMAND = createCommand('SUGGESTION_CLEAR_FORMATTING_COMMAND');
