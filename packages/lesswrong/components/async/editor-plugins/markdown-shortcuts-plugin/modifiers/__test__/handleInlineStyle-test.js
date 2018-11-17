/* eslint-disable no-unused-vars */

import { expect } from 'chai';
import Draft, { EditorState, SelectionState } from 'draft-js';
import handleInlineStyle from '../handleInlineStyle';

describe('handleInlineStyle', () => {
  describe('no markup', () => {
    const rawContentState = {
      entityMap: {},
      blocks: [{
        key: 'item1',
        text: 'Test',
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
      anchorOffset: 6,
      focusKey: 'item1',
      focusOffset: 6,
      isBackward: false,
      hasFocus: true
    });
    const editorState = EditorState.forceSelection(
      EditorState.createWithContent(contentState), selection);
    it('does not convert block type', () => {
      const newEditorState = handleInlineStyle(editorState, ' ');
      expect(newEditorState).to.equal(editorState);
      expect(
        Draft.convertToRaw(newEditorState.getCurrentContent())
      ).to.deep.equal(
        rawContentState
      );
    });
  });

  const testCases = {
    'converts to bold with astarisks': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello **inline** style',
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
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 6,
            offset: 6,
            style: 'BOLD'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts to bold with underscores': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello __inline__ style',
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
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 6,
            offset: 6,
            style: 'BOLD'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts to italic with astarisk': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello *inline* style',
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
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 6,
            offset: 6,
            style: 'ITALIC'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts to italic with underscore': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello _inline_ style',
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
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 6,
            offset: 6,
            style: 'ITALIC'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },
    'combines to italic and bold with astarisks': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello **inline** style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 3,
            offset: 5,
            style: 'ITALIC'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 7, // FIXME
            offset: 5,
            style: 'ITALIC'
          }, {
            length: 6,
            offset: 6,
            style: 'BOLD'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts to code with backquote': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello `inline` style',
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
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 6,
            offset: 6,
            style: 'CODE'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },
    'converts to strikethrough with tildes': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello ~~inline~~ style',
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
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 6,
            offset: 6,
            style: 'STRIKETHROUGH'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },

    // combine tests

    'combines to italic and bold with underscores': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello __inline__ style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 3,
            offset: 5,
            style: 'ITALIC'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 7, // FIXME
            offset: 5,
            style: 'ITALIC'
          }, {
            length: 6,
            offset: 6,
            style: 'BOLD'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
        isBackward: false,
        hasFocus: true
      })
    },

    'combines to bold and italic with underscores': {
      before: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello __inline__ style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 3,
            offset: 5,
            style: 'BOLD'
          }],
          entityRanges: [],
          data: {}
        }]
      },
      after: {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'hello inline style',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [{
            length: 7, // FIXME
            offset: 5,
            style: 'BOLD'
          }, /* { FIXME
            length: 6,
            offset: 6,
            style: 'ITALIC'
          } */],
          entityRanges: [],
          data: {}
        }]
      },
      selection: new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 14,
        focusKey: 'item1',
        focusOffset: 14,
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
        const newEditorState = handleInlineStyle(editorState, character);
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
