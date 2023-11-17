import { RichUtils } from 'draft-js';

const leaveList = (editorState) => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const key = selection.getStartKey();
  const currentBlock = contentState.getBlockForKey(key);
  const type = currentBlock.getType();
  return RichUtils.toggleBlockType(editorState, type);
};

export default leaveList;
