import type { LexicalCommand, LexicalNode } from 'lexical';
import { createCommand } from 'lexical';

export const INSERT_IMAGE_NODE_COMMAND: LexicalCommand<LexicalNode> = createCommand(
  'SUGGESTION_STUB_INSERT_IMAGE_NODE_COMMAND',
);

export type SetImageSizePayload = {
  nodeKey: string;
  width: number | 'inherit';
  height: number | 'inherit';
};

export const SET_IMAGE_SIZE_COMMAND: LexicalCommand<SetImageSizePayload> = createCommand(
  'SUGGESTION_STUB_SET_IMAGE_SIZE_COMMAND',
);
