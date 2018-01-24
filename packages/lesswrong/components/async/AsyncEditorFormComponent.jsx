import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
import createDividerPlugin from './editor-plugins/divider';
import createMathjaxPlugin from 'draft-js-mathjax-plugin'


import {
  createBlockStyleButton,
  ItalicButton,
  BoldButton,
  UnderlineButton,
  BlockquoteButton,
} from 'draft-js-buttons';

const HeadlineOneButton = createBlockStyleButton({
  blockType: 'header-one',
  children: (
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
      <path d="M0 0h24v24H0V0z" fill="none"/>
    </svg>),
});

const HeadlineTwoButton = createBlockStyleButton({
  blockType: 'header-two',
  children: (
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
      <path d="M0 0h24v24H0V0z" fill="none"/>
    </svg>),
});



import { htmlToDraft } from '../../lib/editor/utils.js'
import ImageButton from './editor-plugins/image/ImageButton.jsx';

class AsyncEditorFormComponent extends Component {
  constructor(props, context) {
    super(props,context);
    const initialContent = this.initializeContent();
    this.state = {
      editorState: initialContent,
    };
    this.initializePlugins();
  }

  initializeContent = () => {
    let state = {};
    const {document, name} = this.props;
    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getSavedState();
    if (savedState) {
      try {
        console.log("Restoring saved document state: ", savedState);
        state = EditorState.createWithContent(convertFromRaw(savedState))
        return state;
      } catch(e) {
        console.log(e)
      }
    }

    if (document && !_.isEmpty(document[name])) {
      try {
        state = EditorState.createWithContent(convertFromRaw(document[name]));
        return state;
      } catch(e) {
        console.log("Invalid document content, trying to restore from HTML instead", document);
      }
    }
    if (document && document.htmlBody && Meteor.isClient) {
      const rawDraft = htmlToDraft(document.htmlBody, {flat: true})
      return EditorState.createWithContent(rawDraft);
    } else if (document && document.htmlDescription && Meteor.isClient) {
      const rawDraft = htmlToDraft(document.htmlDescription, {flat: true})
      return EditorState.createWithContent(rawDraft);
    } else {
      return EditorState.createEmpty();
    }
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
        dividerPlugin.DividerButton,
        ImageButton,
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
    const {document, name} = this.props;
    let savedState = {};
    if (document && document._id) { // When restoring the edit state for a specific document, ask for permission
      savedState = ls.get(document._id);
    } else {
      savedState = ls.get(name);
    }
    if (savedState && Meteor.isClient && window) {
      const result = window.confirm("We've found a previously saved state for this document, would you like to restore it?")
      if (result) { return savedState }
    }
    return null;
  }


  // Saves the passed state to localStorage, depending on the available information
  setSavedState = (state) => {
    const {document, name} = this.props;
    if (document && document._id) {
      ls.set(document._id, state);
    } else if (name) {
      ls.set(name, state);
    }
  }

  componentWillMount() {
    const document = this.props.document;
    const fieldName = this.props.name;
    console.log("AsyncEditorFormComponent", fieldName);
    const resetEditor = (result) => {
      // On Form submit, create a new empty editable
      this.setState({
        editorState: EditorState.createEmpty(),
      });

      if (document._id) { ls.remove(document._id) }
      else { ls.remove(fieldName) }

      return result;
    }
    this.context.addToSuccessForm(resetEditor);

    const submitRawContentState = (data) => {
      const contentState = this.state.editorState.getCurrentContent();
      if (contentState.hasText()){
        data[fieldName] = convertToRaw(contentState)
      } else {
        data[fieldName] = null;
      }
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
      // Only save to localStorage on every 30th content change
      this.changeCount = this.changeCount + 1;
      if (this.changeCount % 30 === 0) {
        console.log("saving...");
        const rawContent = convertToRaw(editorState.getCurrentContent());
        console.log(rawContent);
        this.setSavedState(rawContent);
      }
    }
    this.setState({editorState: editorState})
    return editorState;
  }

  render() {
    const InlineToolbar = this.plugins[0].InlineToolbar;
    const AlignmentTool = this.plugins[1].AlignmentTool;
    const contentState = this.state.editorState.getCurrentContent();
    const className = classNames("editor", "content-body", {"content-editor-is-empty": !contentState.hasText()})

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

AsyncEditorFormComponent.contextTypes = {
  addToAutofilledValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

export default AsyncEditorFormComponent;
