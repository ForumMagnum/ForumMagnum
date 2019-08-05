import { expect } from 'chai';
import Draft, { EditorState, SelectionState } from 'draft-js';
import handleBlockType from '../handleBlockType';

describe('handleBlockType', () => {
  describe('no markup', () => {
    const rawContentState = {
      entityMap: {},
      blocks: [{
        key: 'item1',
        text: '[ ]',
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {}
      }]
    };
    const contentState = Draft.convertFromRaw(rawContentState);
    const selection = new SelectionState({
      anchorKey: 'item1',
      anchorOffset: 3,
      focusKey: 'item1',
      focusOffset: 3,
      isBackward: false,
      hasFocus: true
    });
    const editorState = EditorState.forceSelection(
      EditorState.createWithContent(contentState), selection);
    it('does not convert block type', () => {
      const newEditorState = handleBlockType(editorState, ' ');
      expect(newEditorState).to.equal(editorState);
      expect(
        Draft.convertToRaw(newEditorState.getCurrentContent())
      ).to.deep.equal(
        rawContentState
      );
    });
  });

  const testCases = {
    'converts from unstyled to header-one': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '# Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'header-one',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 6,
        focusKey: 'item1',
        focusOffset: 6,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to header-two': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '## Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'header-two',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 7,
        focusKey: 'item1',
        focusOffset: 7,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to header-three': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '### Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'header-three',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 8,
        focusKey: 'item1',
        focusOffset: 8,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to header-four': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '#### Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'header-four',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 9,
        focusKey: 'item1',
        focusOffset: 9,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to header-five': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '##### Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'header-five',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 10,
        focusKey: 'item1',
        focusOffset: 10,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to header-six': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '###### Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'header-six',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 11,
        focusKey: 'item1',
        focusOffset: 11,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to unordered-list-item with hyphen': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '- Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'unordered-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 6,
        focusKey: 'item1',
        focusOffset: 6,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to unordered-list-item with astarisk': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '* Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'unordered-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 6,
        focusKey: 'item1',
        focusOffset: 6,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to ordered-list-item': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '2. Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'ordered-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 7,
        focusKey: 'item1',
        focusOffset: 7,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unordered-list-item to unchecked checkable-list-item': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '[] Test',
          type: 'unordered-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test',
          type: 'checkable-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {
            checked: false
          }
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 1,
        focusKey: 'item1',
        focusOffset: 1,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unordered-list-item to checked checkable-list-item': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '[x]Test',
          type: 'unordered-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test',
          type: 'checkable-list-item',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {
            checked: true
          }
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 3,
        focusKey: 'item1',
        focusOffset: 3,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts from unstyled to blockquote': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: '> Test',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'Test ',
          type: 'blockquote',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 6,
        focusKey: 'item1',
        focusOffset: 6,
        isBackward: false,
        hasFocus: true
      })
    }
  };
  Object.keys(testCases).forEach((k) => {
    describe(k, () => {
      const testCase = testCases[k];
      const { before, after, selection, character = ' ' } = testCase;
      const contentState = Draft.convertFromRaw(before);
      const editorState = EditorState.forceSelection(
        EditorState.createWithContent(contentState), selection);
      it('converts block type', () => {
        const newEditorState = handleBlockType(editorState, character);
        expect(newEditorState).not.to.equal(editorState);
        expect(
          Draft.convertToRaw(newEditorState.getCurrentContent())
        ).to.deep.equal(
          after
        );
      });
    });
  });
});
