import { createCommand } from 'lexical';

export const INSERT_CUSTOM_ORDERED_LIST_COMMAND = createCommand<{
  type?: string;
  marker?: string;
}>('SUGGESTION_STUB_INSERT_CUSTOM_ORDERED_LIST_COMMAND');
