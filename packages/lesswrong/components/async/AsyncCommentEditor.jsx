import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

import classNames from 'classnames';

import ls from 'local-storage';

import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import Editor, { composeDecorators } from 'draft-js-plugins-editor';
import createInlineToolbarPlugin, { Separator } from 'draft-js-inline-toolbar-plugin';
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createResizeablePlugin from 'draft-js-resizeable-plugin';
import createLinkPlugin from 'draft-js-anchor-plugin';
import createRichButtonsPlugin from 'draft-js-richbuttons-plugin';
import createBlockBreakoutPlugin from 'draft-js-block-breakout-plugin'
import createDividerPlugin from 'draft-js-divider-plugin';
import createMathjaxPlugin from 'draft-js-mathjax-plugin';


import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  BlockquoteButton,
} from 'draft-js-buttons';


import { htmlToDraft } from '../../lib/editor/utils.js'

class AsyncCommentEditor extends Component {
  constructor(props, context) {
    super(props,context);
    const document = this.props.document;
    let state = {};
    if (document && document.content) {
      try {
        state = EditorState.createWithContent(convertFromRaw(document.content));
      } catch(e) {
        console.log("Invalid comment content, restoring from HTML instead", document);
        state = document && document.htmlBody && EditorState.createWithContent(htmlToDraft(document.htmlBody, {flat: true}))
      }
    } else if (document && document.htmlBody) {
      state = EditorState.createWithContent(htmlToDraft(document.htmlBody, {flat: true}));
    } else {
      state = EditorState.createEmpty();
    }

    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getSavedState();
    if (savedState) {
      try {
        console.log("Restoring saved comment state: ", savedState);
        state = EditorState.createWithContent(convertFromRaw(savedState))
      } catch(e) {
        console.log(e)
      }
    }

    this.state = {
      editorState: state,
    };

    this.initializePlugins();

  }

  initializePlugins = () => {
    const linkPlugin = createLinkPlugin();
    const alignmentPlugin = createAlignmentPlugin();
    const focusPlugin = createFocusPlugin();
    const resizeablePlugin = createResizeablePlugin();

    const decorator = composeDecorators(
      resizeablePlugin.decorator,
      alignmentPlugin.decorator,
      focusPlugin.decorator,
    );

    const dividerPlugin = createDividerPlugin({decorator});

    const inlineToolbarPlugin = createInlineToolbarPlugin({
      structure: [
        BoldButton,
        ItalicButton,
        UnderlineButton,
        linkPlugin.LinkButton,
        Separator,
        HeadlineOneButton,
        HeadlineTwoButton,
        BlockquoteButton,
      ]
    });

    const markdownShortcutsPlugin = createMarkdownShortcutsPlugin();
    const richButtonsPlugin = createRichButtonsPlugin();
    const blockBreakoutPlugin = createBlockBreakoutPlugin()
    const imagePlugin = createImagePlugin({ decorator });
    this.plugins = [inlineToolbarPlugin, alignmentPlugin, markdownShortcutsPlugin, focusPlugin, resizeablePlugin, imagePlugin, linkPlugin, richButtonsPlugin, blockBreakoutPlugin, dividerPlugin];
    if (Meteor.isClient) {
      const mathjaxPlugin = createMathjaxPlugin()
      this.plugins.push(mathjaxPlugin);
    }
  }

  // Tries to retrieve a saved state from localStorage, depending on the available information
  getSavedState = () => {
    const document = this.props.document;
    if (document && document._id) { // When restoring the edit state for a specific comment, ask for permission
      const savedState = ls.get(document._id);
      if (savedState && Meteor.isClient && window) {
        const result = window.confirm("We've found a previously saved state for this comment, would you like to restore it?")
        if (result) { return savedState }
      } else {
        return null;
      }
    } else if (document && document.parentCommentId) {
      return ls.get('parent:' +  document.parentCommentId)
    } else if (document && document.postId) {
      return ls.get('post:' + document.postId)
    } else {
      return null
    }
  }


  // Saves the passed state to localStorage, depending on the available information
  setSavedState = (state) => {
    const document = this.props.document;
    if (document && document._id) {
      ls.set(document._id, state);
    } else if (document && document.parentCommentId) {
      ls.set('parent:' + document.parentCommentId, state);
    } else if (document && document.postId, state) {
      ls.set('post:' + document.postId, state);
    }
  }

  componentWillMount() {
    const document = this.props.document;
    const fieldName = this.props.name;
    const resetEditor = (result) => {
      // On Form submit, create a new empty editable
      this.setState({
        editorState: EditorState.createEmpty(),
      });

      if (document && document._id) { ls.remove(document._id) }
      else if (document && document.parentCommentId) { ls.remove("parent:" + document.parentCommentId) }
      else if (document && document.postId) { ls.remove("post:"+document.postId)}
      else {ls.remove(fieldName)}

      return result;
    }
    this.context.addToSuccessForm(resetEditor);

    const submitRawContentState = (data) => {
      data.content = convertToRaw(this.state.editorState.getCurrentContent())
      return data;
    }
    this.context.addToSubmitForm(submitRawContentState);
  }

  focus = () => {
    this.editor.focus();
  }

  changeCount = 0;

  onChange = (editorState) => {
    const currentContent = this.state.editorState.getCurrentContent()
    const newContent = editorState.getCurrentContent()

    if (currentContent !== newContent) {
      // Only save to localStorage on every 10th content change
      this.changeCount = this.changeCount + 1;
      if (this.changeCount % 10 === 0) {
        console.log("saving...");
        const contentState = editorState.getCurrentContent();
        this.setSavedState(convertToRaw(contentState));
      }
    }
    this.setState({editorState: editorState})
    return editorState;
  }

  render() {
    const InlineToolbar = this.plugins[0].InlineToolbar;
    const AlignmentTool = this.plugins[1].AlignmentTool;

    const contentState = this.state.editorState.getCurrentContent();
    const className = classNames("commentEditor", "editor", "content-body", "comments-item-text", {"content-editor-is-empty": !contentState.hasText()})

    return (
      <div className={className} onClick={this.focus}>
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          plugins={this.plugins}
          ref={(element) => { this.editor = element; }}
        />
        <InlineToolbar />
        <AlignmentTool />
      </div>
    )
  }
}

AsyncCommentEditor.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
  addToSubmitForm: React.PropTypes.func,
};

export default AsyncCommentEditor;
