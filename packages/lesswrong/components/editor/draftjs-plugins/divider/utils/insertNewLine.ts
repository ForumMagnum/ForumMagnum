import { List } from 'immutable';
import {
  Modifier,
  ContentBlock,
  EditorState,
  BlockMapBuilder,
  genKey as generateRandomKey,
  ContentState,
} from 'draft-js';

const genContentBlock = () =>
  new ContentBlock({
    key: generateRandomKey(),
    type: 'unstyled',
    text: '',
    // @ts-ignore The type definitions are wrong, this does have a class constructor
    characterList: new List(),
  });

const insertNewLine = (editorState: EditorState, block: ContentBlock, insertAt: 'after' | 'before' | 'both' = 'after') => {
  // insertAt can be 'before' or 'after' or 'both'
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  let fragmentArray: ContentBlock[];

  switch (insertAt) {
    case 'after':
      fragmentArray = [block, genContentBlock()];
      break;
    case 'before':
      fragmentArray = [genContentBlock(), block];
      break;
    case 'both':
      fragmentArray = [genContentBlock(), block, genContentBlock()];
      break;
  }

  const fragment = BlockMapBuilder.createFromArray(fragmentArray);

  const withUnstyledBlock = Modifier.replaceWithFragment(
    contentState,
    selectionState,
    fragment,
  );

  const newContent = withUnstyledBlock.merge({
    selectionBefore: selectionState,
    selectionAfter: withUnstyledBlock.getSelectionAfter().set('hasFocus', true),
  }) as ContentState;

  return EditorState.push(editorState, newContent, 'insert-fragment');
};

export const insertNewLineAfter = (editorState: EditorState, block: ContentBlock) =>
  insertNewLine(editorState, block);

export const insertNewLineBefore = (editorState: EditorState, block: ContentBlock) =>
  insertNewLine(editorState, block, 'before');

export const insertNewLineBoth = (editorState: EditorState, block: ContentBlock) =>
  insertNewLine(editorState, block, 'both');

export default insertNewLine;
