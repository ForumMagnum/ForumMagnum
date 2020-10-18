import { List } from 'immutable';
import {
  Modifier,
  ContentBlock,
  EditorState,
  BlockMapBuilder,
  genKey as generateRandomKey,
} from 'draft-js';

const genContentBlock = () =>
  new ContentBlock({
    key: generateRandomKey(),
    type: 'unstyled',
    text: '',
    characterList: new List(),
  });

const insertNewLine = (editorState, block, insertAt = 'after') => {
  // insertAt can be 'before' or 'after' or 'both'
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  let fragmentArray;

  if (insertAt === 'after') {
    fragmentArray = [block, genContentBlock()];
  }

  if (insertAt === 'before') {
    fragmentArray = [genContentBlock(), block];
  }

  if (insertAt === 'both') {
    fragmentArray = [genContentBlock(), block, genContentBlock()];
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
  });

  return EditorState.push(editorState, newContent, 'insert-fragment');
};

export const insertNewLineAfter = (editorState, block) =>
  insertNewLine(editorState, block);

export const insertNewLineBefore = (editorState, block) =>
  insertNewLine(editorState, block, 'before');

export const insertNewLineBoth = (editorState, block) =>
  insertNewLine(editorState, block, 'both');

export default insertNewLine;
