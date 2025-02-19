import { CheckableListItemUtils } from 'draft-js-checkable-list-item';
import { RichUtils } from 'draft-js';

const adjustBlockDepth = (editorState, ev) => {
  const newEditorState = CheckableListItemUtils.onTab(ev, editorState, 4);
  if (newEditorState !== editorState) {
    return newEditorState;
  }
  return RichUtils.onTab(ev, editorState, 4);
};

export default adjustBlockDepth;
