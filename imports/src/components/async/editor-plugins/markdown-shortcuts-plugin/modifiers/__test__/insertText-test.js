import { expect } from 'chai';
import Draft, { EditorState, SelectionState } from 'draft-js';
import insertText from '../insertText';

describe('insertText', () => {
  const beforeRawContentState = {
    entityMap: {},
    blocks: [{
      key: 'item1',
      text: 'text0',
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {}
    }]
  };
  const afterRawContentState = {
    entityMap: {},
    blocks: [{
      key: 'item1',
      text: 'text01',
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {}
    }]
  };
  const selection = new SelectionState({
    anchorKey: 'item1',
    anchorOffset: 5,
    focusKey: 'item1',
    focusOffset: 5,
    isBackward: false,
    hasFocus: true
  });
  const contentState = Draft.convertFromRaw(beforeRawContentState);
  const editorState = EditorState.forceSelection(
    EditorState.createWithContent(contentState), selection);
  it('insert text', () => {
    const newEditorState = insertText(editorState, '1');
    expect(newEditorState).not.to.equal(editorState);
    expect(
      Draft.convertToRaw(newEditorState.getCurrentContent())
    ).to.deep.equal(
      afterRawContentState
    );
  });
});
