import { createCommand } from 'lexical';

export const SET_SELECTION_STYLE_PROPERTY_COMMAND = createCommand<{
  property: string;
  value: string | null;
}>('SUGGESTION_STUB_SET_SELECTION_STYLE_PROPERTY_COMMAND');

export const CLEAR_FORMATTING_COMMAND = createCommand('SUGGESTION_STUB_CLEAR_FORMATTING_COMMAND');
