import { createCommand } from 'lexical';

export const BEFOREINPUT_EVENT_COMMAND = createCommand<InputEvent>('BEFORE_INPUT_EVENT_COMMAND');
export const INPUT_EVENT_COMMAND = createCommand<InputEvent>('INPUT_EVENT_COMMAND');
export const COMPOSITION_START_EVENT_COMMAND = createCommand<CompositionEvent>('COMPOSITION_START_EVENT_COMMAND');
export const INSERT_FILE_COMMAND = createCommand<File | Blob>('INSERT_FILE_COMMAND');
