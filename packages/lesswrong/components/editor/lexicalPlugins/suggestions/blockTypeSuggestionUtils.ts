import type { ElementNode } from 'lexical';
import {
  $createParagraphNode,
  $isParagraphNode,
  createCommand,
} from 'lexical';
import type { HeadingTagType } from '@lexical/rich-text';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import type { ListType } from '@lexical/list';
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list';
import { $createCodeNode, $isCodeNode } from '@lexical/code';

export type BlockType = 'paragraph' | 'code' | 'quote' | HeadingTagType | ListType;

export const blockTypeToCreateElementFn: { [k in BlockType]: () => ElementNode } = {
  paragraph: () => $createParagraphNode(),
  code: () => $createCodeNode(),
  quote: () => $createQuoteNode(),
  h1: () => $createHeadingNode('h1'),
  h2: () => $createHeadingNode('h2'),
  h3: () => $createHeadingNode('h3'),
  h4: () => $createHeadingNode('h4'),
  h5: () => $createHeadingNode('h5'),
  h6: () => $createHeadingNode('h6'),
  bullet: () => {
    const list = $createListNode('bullet');
    list.append($createListItemNode());
    return list;
  },
  number: () => {
    const list = $createListNode('number');
    list.append($createListItemNode());
    return list;
  },
  check: () => {
    const list = $createListNode('check');
    list.append($createListItemNode());
    return list;
  },
};

// Only standard block types are supported for suggested edits. Custom block
// types (spoilers, collapsible sections, etc.) should not be returned here.
export const $getElementBlockType = (node: ElementNode): BlockType | null => {
  if ($isHeadingNode(node)) {
    return node.getTag();
  }
  if ($isQuoteNode(node)) {
    return 'quote';
  }
  if ($isCodeNode(node)) {
    return 'code';
  }
  if ($isListNode(node)) {
    return node.getListType();
  }
  if ($isListItemNode(node)) {
    const parent = node.getParent();
    if ($isListNode(parent)) {
      return parent.getListType();
    }
  }
  if ($isParagraphNode(node)) {
    return 'paragraph';
  }
  return null;
};

export const SET_BLOCK_TYPE_COMMAND = createCommand<BlockType>('SUGGESTION_STUB_SET_BLOCK_TYPE_COMMAND');

export const blockTypeToBlockName: { [k in BlockType]: string } = {
  paragraph: 'Normal',
  code: 'Code block',
  quote: 'Quote',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  bullet: 'Bulleted list',
  number: 'Numbered list',
  check: 'Check list',
};
