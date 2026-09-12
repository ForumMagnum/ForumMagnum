import type { LexicalCommand, NodeKey } from 'lexical';
import { createCommand } from 'lexical';
import type { ImagePayload } from '../../nodes/ImageNode';

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand(
  'INSERT_IMAGE_COMMAND',
);

export type SetImageSizePayload = {
  nodeKey: NodeKey;
  widthPercent: number | null;
};

export const SET_IMAGE_SIZE_COMMAND: LexicalCommand<SetImageSizePayload> = createCommand(
  'SET_IMAGE_SIZE_COMMAND',
);

export type SetImageCaptionVisibilityPayload = {
  nodeKey: NodeKey;
  showCaption: boolean;
};

export const SET_IMAGE_CAPTION_VISIBILITY_COMMAND: LexicalCommand<SetImageCaptionVisibilityPayload> = createCommand(
  'SET_IMAGE_CAPTION_VISIBILITY_COMMAND',
);
