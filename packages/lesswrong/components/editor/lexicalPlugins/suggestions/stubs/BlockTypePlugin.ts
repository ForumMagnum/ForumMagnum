import type { ElementNode } from 'lexical';
import { $createParagraphNode, createCommand } from 'lexical';
import type { ListType } from '@lexical/list';

export type BlockType = 'paragraph' | 'code' | 'quote' | ListType;

export const blockTypeToCreateElementFn: { [k in BlockType]: () => ElementNode } = {
  paragraph: () => $createParagraphNode(),
  code: () => $createParagraphNode(),
  quote: () => $createParagraphNode(),
  bullet: () => $createParagraphNode(),
  number: () => $createParagraphNode(),
  check: () => $createParagraphNode(),
};

export const $getElementBlockType = (): BlockType | null => null;

export const SET_BLOCK_TYPE_COMMAND = createCommand<BlockType>('SUGGESTION_STUB_SET_BLOCK_TYPE_COMMAND');

export const blockTypeToBlockName: { [k in BlockType]: string } = {
  paragraph: 'Normal',
  code: 'Code block',
  quote: 'Quote',
  bullet: 'Bulleted list',
  number: 'Numbered list',
  check: 'Check list',
};
