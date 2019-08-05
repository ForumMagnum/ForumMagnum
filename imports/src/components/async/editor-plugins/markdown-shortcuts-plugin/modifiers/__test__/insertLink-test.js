import { expect } from 'chai';
import Draft, { EditorState, SelectionState } from 'draft-js';
import insertLink from '../insertLink';

describe('insertLink', () => {
  const markup = '[bar](http://cultofthepartyparrot.com/ "party")';
  const text = `foo ${markup} baz`;
  const beforeRawContentState = {
    entityMap: {},
    blocks: [{
      key: 'item1',
      text,
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {}
    }]
  };
  const afterRawContentState = {
    entityMap: {
      0: {
        data: {
          href: 'http://cultofthepartyparrot.com/parrots/aussieparrot.gif',
          title: 'party'
        },
        mutability: 'MUTABLE',
        type: 'LINK'
      }
    },
    blocks: [{
      key: 'item1',
      text: 'foo bar  baz',
      type: 'unstyled',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [{
        key: 0,
        length: 3,
        offset: 4
      }],
      data: {}
    }]
  };
  const selection = new SelectionState({
    anchorKey: 'item1',
    anchorOffset: 6,
    focusKey: 'item1',
    focusOffset: 6,
    isBackward: false,
    hasFocus: true
  });
  const contentState = Draft.convertFromRaw(beforeRawContentState);
  const editorState = EditorState.forceSelection(
    EditorState.createWithContent(contentState), selection);
  it('converts block type', () => {
    const matchArr = [markup, 'bar', 'http://cultofthepartyparrot.com/parrots/aussieparrot.gif', 'party'];
    matchArr.index = 4;
    matchArr.input = text;
    const newEditorState = insertLink(editorState, matchArr);
    expect(newEditorState).not.to.equal(editorState);
    expect(
      Draft.convertToRaw(newEditorState.getCurrentContent())
    ).to.deep.equal(
      afterRawContentState
    );
  });
});
