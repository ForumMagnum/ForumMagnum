import type { LexicalNode } from 'lexical';

export const $isImageNode = (_node: LexicalNode | null | undefined): boolean => false;

export const $createImageNode = (): never => {
  throw new Error('Image suggestions are not implemented in text-only mode.');
};
