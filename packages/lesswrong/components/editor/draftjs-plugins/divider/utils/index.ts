import { ContentBlock, ContentState, EditorState } from 'draft-js';

/*
Returns default block-level metadata for various block type. Empty object otherwise.
*/
export const getDefaultBlockData = (blockType: string, initialData = {}) => {
  switch (blockType) {
    // case Block.TODO:
    //   return { checked: false };
    default:
      return initialData;
  }
};

/*
Get currentBlock in the editorState.
*/
export const getCurrentBlock = (editorState: EditorState) => {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(selectionState.getStartKey());
  return block;
};

/*
Adds a new block (currently replaces an empty block) at the current cursor position
of the given `newType`.
*/
export const addNewBlock = (
  editorState: EditorState,
  newType = 'unstyled',
  initialData = {},
) => {
  const selectionState = editorState.getSelection();
  if (!selectionState.isCollapsed()) {
    return editorState;
  }
  const contentState = editorState.getCurrentContent();
  const key = selectionState.getStartKey();
  const blockMap = contentState.getBlockMap();
  const currentBlock = getCurrentBlock(editorState);
  if (!currentBlock) {
    return editorState;
  }
  if (currentBlock.getLength() === 0) {
    if (currentBlock.getType() === newType) {
      return editorState;
    }
    const newBlock = currentBlock.merge({
      type: newType,
      data: getDefaultBlockData(newType, initialData),
    }) as ContentBlock;
    const newContentState = contentState.merge({
      blockMap: blockMap.set(key, newBlock),
      selectionAfter: selectionState,
    }) as ContentState;

    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      'change-block-type',
    );

    return EditorState.forceSelection(
      newEditorState,
      contentState.getSelectionAfter(),
    );
  }

  return editorState;
};

export const isFirstBlock = (editorState: EditorState) => {
  const contentState = editorState.getCurrentContent();

  return getCurrentBlock(editorState) === contentState.getFirstBlock();
};

export const isLastBlock = (editorState: EditorState) => {
  const contentState = editorState.getCurrentContent();

  return getCurrentBlock(editorState) === contentState.getLastBlock();
};

/*
Changes the block type of the current block.
*/
export const resetBlockWithType = (
  editorState: EditorState,
  newType = 'unstyled',
  overrides = {},
) => {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const key = selectionState.getStartKey();
  const blockMap = contentState.getBlockMap();
  const block = blockMap.get(key);
  const newBlock = block.mergeDeep(overrides, {
    type: newType,
    data: getDefaultBlockData(newType),
  }) as ContentBlock;
  const newContentState = contentState.merge({
    blockMap: blockMap.set(key, newBlock),
    selectionAfter: selectionState.merge({
      anchorOffset: 0,
      focusOffset: 0,
    }),
  }) as ContentState;
  return EditorState.push(editorState, newContentState, 'change-block-type');
};
