import { genKey, ContentBlock, EditorState } from 'draft-js';
import { List, Map } from 'immutable';

const insertEmptyBlock = (editorState, blockType = 'unstyled', data = {}) => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const key = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(key);
  const emptyBlockKey = genKey();
  const emptyBlock = new ContentBlock({
    characterList: List(),
    depth: 0,
    key: emptyBlockKey,
    text: '',
    type: blockType,
    data: Map().merge(data)
  });
  const blockMap = contentState.getBlockMap();
  const blocksBefore = blockMap.toSeq().takeUntil((value) => value === currentBlock);
  const blocksAfter = blockMap.toSeq().skipUntil((value) => value === currentBlock).rest();
  const augmentedBlocks = [
    [
      currentBlock.getKey(),
      currentBlock,
    ],
    [
      emptyBlockKey,
      emptyBlock,
    ],
  ];
  const newBlocks = blocksBefore.concat(augmentedBlocks, blocksAfter).toOrderedMap();
  const focusKey = emptyBlockKey;
  const newContentState = contentState.merge({
    blockMap: newBlocks,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: focusKey,
      anchorOffset: 0,
      focusKey,
      focusOffset: 0,
      isBackward: false,
    }),
  });
  return EditorState.push(
    editorState,
    newContentState,
    'split-block'
  );
};

export default insertEmptyBlock;
