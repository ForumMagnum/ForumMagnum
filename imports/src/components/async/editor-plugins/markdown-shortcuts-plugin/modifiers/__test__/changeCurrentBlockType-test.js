import { expect } from 'chai';
import Draft, { EditorState, SelectionState } from 'draft-js';
import changeCurrentBlockType from '../changeCurrentBlockType';

describe('changeCurrentBlockType', () => {
  const rawContentState = (text, type, data = {}) => ({
    entityMap: {},
    blocks: [{
      key: 'item1',
      text,
      type,
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data
    }]
  });
  const selectionState = new SelectionState({
    anchorKey: 'item1',
    anchorOffset: 0,
    focusKey: 'item1',
    focusOffset: 0,
    isBackward: false,
    hasFocus: true
  });
  const createEditorState = (...args) => {
    const contentState = Draft.convertFromRaw(rawContentState(...args));
    return EditorState.forceSelection(
      EditorState.createWithContent(contentState),
      selectionState);
  };
  it('changes block type', () => {
    const editorState = createEditorState('Yo', 'unstyled');
    const newEditorState = changeCurrentBlockType(
      editorState, 'header-one', 'Hello world', { foo: 'bar' });
    expect(newEditorState).not.to.equal(editorState);
    expect(
      Draft.convertToRaw(newEditorState.getCurrentContent())
    ).to.deep.equal(
      rawContentState('Hello world', 'header-one', { foo: 'bar' })
    );
  });
  it('changes block type even if data is null', () => {
    const editorState = createEditorState('Yo', 'unstyled');
    const newEditorState = changeCurrentBlockType(
      editorState, 'header-one', 'Hello world', null);
    expect(newEditorState).not.to.equal(editorState);
    expect(
      Draft.convertToRaw(newEditorState.getCurrentContent())
    ).to.deep.equal(
      rawContentState('Hello world', 'header-one', {})
    );
  });
});
