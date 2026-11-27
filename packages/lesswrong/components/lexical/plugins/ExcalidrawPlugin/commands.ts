import {createCommand, type LexicalCommand, type NodeKey} from 'lexical';

/** Opens the diagram editor to create a new diagram. */
export const INSERT_EXCALIDRAW_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_EXCALIDRAW_COMMAND',
);

/** Opens the diagram editor to edit the ExcalidrawNode with the given key. */
export const EDIT_EXCALIDRAW_COMMAND: LexicalCommand<NodeKey> = createCommand(
  'EDIT_EXCALIDRAW_COMMAND',
);

/**
 * Adds a caption to the ExcalidrawNode with the given key, or removes the
 * caption if it has one.
 */
export const TOGGLE_EXCALIDRAW_CAPTION_COMMAND: LexicalCommand<NodeKey> = createCommand(
  'TOGGLE_EXCALIDRAW_CAPTION_COMMAND',
);
