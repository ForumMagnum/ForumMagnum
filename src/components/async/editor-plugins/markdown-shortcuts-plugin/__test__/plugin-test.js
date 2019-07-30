import { expect } from 'chai';
import sinon from 'sinon';
import Draft, { EditorState, SelectionState, ContentBlock } from 'draft-js';
import { CheckableListItem, CheckableListItemUtils } from 'draft-js-checkable-list-item';

import { Map, List } from 'immutable';
import createMarkdownShortcutsPlugin from '../';

describe('draft-js-markdown-shortcuts-plugin', () => {
  afterEach(() => {
    /* eslint-disable no-underscore-dangle */
    createMarkdownShortcutsPlugin.__ResetDependency__('adjustBlockDepth');
    createMarkdownShortcutsPlugin.__ResetDependency__('handleBlockType');
    createMarkdownShortcutsPlugin.__ResetDependency__('handleInlineStyle');
    createMarkdownShortcutsPlugin.__ResetDependency__('handleNewCodeBlock');
    createMarkdownShortcutsPlugin.__ResetDependency__('insertEmptyBlock');
    createMarkdownShortcutsPlugin.__ResetDependency__('handleLink');
    createMarkdownShortcutsPlugin.__ResetDependency__('handleImage');
    createMarkdownShortcutsPlugin.__ResetDependency__('leaveList');
    createMarkdownShortcutsPlugin.__ResetDependency__('changeCurrentBlockType');
    createMarkdownShortcutsPlugin.__ResetDependency__('replaceText');
    createMarkdownShortcutsPlugin.__ResetDependency__('checkReturnForState');
    /* eslint-enable no-underscore-dangle */
  });

  const createEditorState = (rawContent, rawSelection) => {
    const contentState = Draft.convertFromRaw(rawContent);
    return EditorState.forceSelection(
      EditorState.createWithContent(contentState),
      rawSelection
    );
  };

  let plugin;
  let store;
  let currentEditorState;
  let newEditorState;
  let currentRawContentState;
  let newRawContentState;
  let currentSelectionState;
  let subject;
  let event;

  let modifierSpy;

  [
    [],
    [{ insertEmptyBlockOnReturnWithModifierKey: false }]
  ].forEach((args) => {
    beforeEach(() => {
      modifierSpy = sinon.spy(() => newEditorState);

      event = new window.KeyboardEvent('keydown');
      sinon.spy(event, 'preventDefault');
      currentSelectionState = new SelectionState({
        anchorKey: 'item1',
        anchorOffset: 0,
        focusKey: 'item1',
        focusOffset: 0,
        isBackward: false,
        hasFocus: true
      });

      newRawContentState = {
        entityMap: {},
        blocks: [{
          key: 'item1',
          text: 'altered!!',
          type: 'unstyled',
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {}
        }]
      };
      newEditorState = EditorState.createWithContent(Draft.convertFromRaw(newRawContentState));

      store = {
        setEditorState: sinon.spy(),
        getEditorState: sinon.spy(() => {
          currentEditorState = createEditorState(currentRawContentState, currentSelectionState);
          return currentEditorState;
        })
      };
      subject = null;
    });

    describe(args.length === 0 ? 'without config' : 'with `insertEmptyBlockOnReturnWithModifierKey: false` config', () => {
      beforeEach(() => {
        plugin = createMarkdownShortcutsPlugin(...args);
      });

      it('is loaded', () => {
        expect(createMarkdownShortcutsPlugin).to.be.a('function');
      });
      it('initialize', () => {
        plugin.initialize(store);
        expect(plugin.store).to.deep.equal(store);
      });
      describe('handleReturn', () => {
        const expectsHandled = () => {
          expect(subject()).to.equal('handled');
          expect(modifierSpy).to.have.been.calledOnce();
          expect(store.setEditorState).to.have.been.calledWith(newEditorState);
        };
        const expectsNotHandled = () => {
          expect(subject()).to.equal('not-handled');
          expect(modifierSpy).not.to.have.been.calledOnce();
          expect(store.setEditorState).not.to.have.been.called();
        };
        beforeEach(() => {
          subject = () => plugin.handleReturn(event, store.getEditorState(), store);
        });
        it('does not handle', () => {
          currentRawContentState = {
            entityMap: {},
            blocks: [{
              key: 'item1',
              text: '',
              type: 'unstyled',
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }]
          };
          expectsNotHandled();
        });
        it('leaves from list', () => {
          createMarkdownShortcutsPlugin.__Rewire__('leaveList', modifierSpy); // eslint-disable-line no-underscore-dangle
          currentRawContentState = {
            entityMap: {},
            blocks: [{
              key: 'item1',
              text: '',
              type: 'ordered-list-item',
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }]
          };
          expectsHandled();
        });
        const testInsertNewBlock = (type, expects) => () => {
          createMarkdownShortcutsPlugin.__Rewire__('insertEmptyBlock', modifierSpy); // eslint-disable-line no-underscore-dangle
          currentRawContentState = {
            entityMap: {},
            blocks: [{
              key: 'item1',
              text: 'Hello',
              type,
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }]
          };
          currentSelectionState = new SelectionState({
            anchorKey: 'item1',
            anchorOffset: 5,
            focusKey: 'item1',
            focusOffset: 5,
            isBackward: false,
            hasFocus: true
          });
          expects();
        };
        const expects = args[0] && args[0].insertEmptyBlockOnReturnWithModifierKey === false
          ? expectsNotHandled
          : expectsHandled;
        ['one', 'two', 'three', 'four', 'five', 'six'].forEach((level) => {
          describe(`on header-${level}`, () => {
            it('inserts new empty block on end of header return', testInsertNewBlock(`header-${level}`, expects));
          });
        });
        ['ctrlKey', 'shiftKey', 'metaKey', 'altKey'].forEach((key) => {
          describe(`${key} is pressed`, () => {
            beforeEach(() => {
              const props = {};
              props[key] = true;
              event = new window.KeyboardEvent('keydown', props);
            });
            it('inserts new empty block', testInsertNewBlock('blockquote', expects));
          });
        });
        it('handles new code block', () => {
          createMarkdownShortcutsPlugin.__Rewire__('handleNewCodeBlock', modifierSpy); // eslint-disable-line no-underscore-dangle
          currentRawContentState = {
            entityMap: {},
            blocks: [{
              key: 'item1',
              text: '```',
              type: 'unstyled',
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }]
          };
          expect(subject()).to.equal('handled');
          expect(modifierSpy).to.have.been.calledOnce();
          expect(store.setEditorState).to.have.been.calledWith(newEditorState);
        });
        it('handle code block closing', () => {
          createMarkdownShortcutsPlugin.__Rewire__('changeCurrentBlockType', modifierSpy); // eslint-disable-line no-underscore-dangle
          currentRawContentState = {
            entityMap: {},
            blocks: [{
              key: 'item1',
              text: 'foo\n```',
              type: 'code-block',
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }]
          };
          expect(subject()).to.equal('handled');
          expect(modifierSpy).to.have.been.calledOnce();
        });
        it('insert new line char from code-block', () => {
          createMarkdownShortcutsPlugin.__Rewire__('insertText', modifierSpy); // eslint-disable-line no-underscore-dangle
          currentRawContentState = {
            entityMap: {},
            blocks: [{
              key: 'item1',
              text: 'const foo = a => a',
              type: 'code-block',
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }]
          };
          expect(subject()).to.equal('handled');
          expect(modifierSpy).to.have.been.calledOnce();
          expect(store.setEditorState).to.have.been.calledWith(newEditorState);
        });
      });
      describe('blockStyleFn', () => {
        let type;
        beforeEach(() => {
          type = null;
          const getType = () => type;
          subject = () => plugin.blockStyleFn({ getType });
        });
        it('returns checkable-list-item', () => {
          type = 'checkable-list-item';
          expect(subject()).to.equal('checkable-list-item');
        });
        it('returns null', () => {
          type = 'ordered-list-item';
          expect(subject()).to.be.null();
        });
      });
      describe('blockRendererFn', () => {
        let type;
        let data;
        let block;
        let spyOnChangeChecked;
        beforeEach(() => {
          type = null;
          data = {};
          spyOnChangeChecked = sinon.spy(CheckableListItemUtils, 'toggleChecked');
          subject = () => {
            block = new ContentBlock({
              type,
              data: Map(data),
              key: 'item1',
              characterList: List()
            });
            return plugin.blockRendererFn(block, store);
          };
        });
        afterEach(() => {
          CheckableListItemUtils.toggleChecked.restore();
        });
        it('returns renderer', () => {
          type = 'checkable-list-item';
          data = { checked: true };
          const renderer = subject();
          expect(renderer).to.be.an('object');
          expect(renderer.component).to.equal(CheckableListItem);
          expect(renderer.props.onChangeChecked).to.be.a('function');
          expect(renderer.props.checked).to.be.true();
          renderer.props.onChangeChecked();
          expect(spyOnChangeChecked).to.have.been.calledWith(currentEditorState, block);
        });
        it('returns null', () => {
          type = 'ordered-list-item';
          expect(subject()).to.be.null();
        });
      });
      describe('onTab', () => {
        beforeEach(() => {
          subject = () => {
            createMarkdownShortcutsPlugin.__Rewire__('adjustBlockDepth', modifierSpy); // eslint-disable-line no-underscore-dangle
            return plugin.onTab(event, store);
          };
        });
        describe('no changes', () => {
          it('returns handled', () => {
            expect(subject()).to.equal('handled');
          });
          it('returns not-handled', () => {
            modifierSpy = sinon.spy(() => currentEditorState);
            expect(subject()).to.equal('not-handled');
          });
        });
      });
      describe('handleBeforeInput', () => {
        let character;
        beforeEach(() => {
          character = ' ';
          subject = () => plugin.handleBeforeInput(character, store.getEditorState(), store);
        });
        [
          'handleBlockType',
          'handleImage',
          'handleLink',
          'handleInlineStyle'
        ].forEach((modifier) => {
          describe(modifier, () => {
            beforeEach(() => {
              createMarkdownShortcutsPlugin.__Rewire__(modifier, modifierSpy); // eslint-disable-line no-underscore-dangle
            });
            it('returns handled', () => {
              expect(subject()).to.equal('handled');
              expect(modifierSpy).to.have.been.calledWith(currentEditorState, ' ');
            });
          });
        });
        describe('character is not a space', () => {
          beforeEach(() => {
            character = 'x';
          });
          it('returns not-handled', () => {
            expect(subject()).to.equal('not-handled');
          });
        });
        describe('no matching modifiers', () => {
          it('returns not-handled', () => {
            expect(subject()).to.equal('not-handled');
          });
        });
      });
      describe('handlePastedText', () => {
        let pastedText;
        let html;
        beforeEach(() => {
          pastedText = `_hello world_
          Hello`;
          html = undefined;
          subject = () => plugin.handlePastedText(pastedText, html, store.getEditorState(), store);
        });
        [
          'replaceText',
          'handleBlockType',
          'handleImage',
          'handleLink',
          'handleInlineStyle'
        ].forEach((modifier) => {
          describe(modifier, () => {
            beforeEach(() => {
              createMarkdownShortcutsPlugin.__Rewire__(modifier, modifierSpy); // eslint-disable-line no-underscore-dangle
            });
            it('returns handled', () => {
              expect(subject()).to.equal('handled');
              expect(modifierSpy).to.have.been.called();
            });
          });
        });
        describe('nothing in clipboard', () => {
          beforeEach(() => {
            pastedText = '';
          });
          it('returns not-handled', () => {
            expect(subject()).to.equal('not-handled');
          });
        });
        describe('pasted just text', () => {
          beforeEach(() => {
            pastedText = 'hello';
            createMarkdownShortcutsPlugin.__Rewire__('replaceText', modifierSpy); // eslint-disable-line no-underscore-dangle
          });
          it('returns handled', () => {
            expect(subject()).to.equal('handled');
            expect(modifierSpy).to.have.been.calledWith(currentEditorState, 'hello');
          });
        });
        describe('pasted just text with new line code', () => {
          beforeEach(() => {
            pastedText = 'hello\nworld';
            const rawContentState = {
              entityMap: {},
              blocks: [{
                key: 'item1',
                text: '',
                type: 'unstyled',
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {}
              }]
            };
            const otherRawContentState = {
              entityMap: {},
              blocks: [{
                key: 'item2',
                text: 'H1',
                type: 'header-one',
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {}
              }]
            };
            /* eslint-disable no-underscore-dangle */
            createMarkdownShortcutsPlugin.__Rewire__('replaceText', () => createEditorState(rawContentState, currentSelectionState));
            createMarkdownShortcutsPlugin.__Rewire__('checkReturnForState', () => createEditorState(otherRawContentState, currentSelectionState));
            /* eslint-enable no-underscore-dangle */
          });
          it('return handled', () => {
            expect(subject()).to.equal('handled');
          });
        });
        describe('passed `html` argument', () => {
          beforeEach(() => {
            pastedText = '# hello';
            html = '<h1>hello</h1>';
          });
          it('returns not-handled', () => {
            expect(subject()).to.equal('not-handled');
          });
        });
      });
    });
  });
});
