import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Editable, createEmptyState } from 'ory-editor-core';
import { Toolbar } from 'ory-editor-ui'
import withEditor from './withEditor.jsx'

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

import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  CodeButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  HeadlineThreeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from 'draft-js-buttons';


import { convertToHTML, convertFromHTML } from 'draft-convert';


const htmlToDraft = convertFromHTML({
  htmlToEntity: (nodeName, node, createEntity) => {
    if (nodeName === 'a') {
      return createEntity(
        'LINK',
        'MUTABLE',
        {url: node.href}
      )
    }
  },
})

const initialState = {
    "entityMap": {
        "0": {
            "type": "image",
            "mutability": "IMMUTABLE",
            "data": {
                "src": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
            }
        }
    },
    "blocks": [{
        "key": "9gm3s",
        "text": "You can have images in your text field. This is a very rudimentary example, but you can enhance the image plugin with resizing, focus or alignment plugins.",
        "type": "unstyled",
        "depth": 0,
        "inlineStyleRanges": [],
        "entityRanges": [],
        "data": {}
    }, {
        "key": "ov7r",
        "text": " ",
        "type": "atomic",
        "depth": 0,
        "inlineStyleRanges": [],
        "entityRanges": [{
            "offset": 0,
            "length": 1,
            "key": 0
        }],
        "data": {}
    }, {
        "key": "e23a8",
        "text": "See advanced examples further down …",
        "type": "unstyled",
        "depth": 0,
        "inlineStyleRanges": [],
        "entityRanges": [],
        "data": {}
    }]
};

class CommentEditor extends Component {
  constructor(props, context) {
    super(props,context);
    // let editor = this.props.editor;
    const document = this.props.document;
    let state = {};
    if (document && document.content) {
      console.log("initial CommentEditor state", document.content);
      try {
        state = EditorState.createWithContent(convertFromRaw(document.content));
      } catch(e) {
        console.log("Invalid comment content, restoring from HTML instead", document);
        state = document && document.htmlBody && EditorState.createWithContent(htmlToDraft(document.htmlBody))
      }
    } else if (document && document.htmlBody) {
      console.log("initial CommentEditor state", document.htmlBody);
      state = EditorState.createWithContent(htmlToDraft(document.htmlBody));
    }
    else {
      state = EditorState.createWithContent(convertFromRaw(initialState));
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

    console.log("CommentEditor state", state);

    this.state = {
      editorState: state,
    };
    // editor.trigger.editable.add(state);
    const linkPlugin = createLinkPlugin();
    const inlineToolbarPlugin = createInlineToolbarPlugin({
      structure: [
        BoldButton,
        ItalicButton,
        UnderlineButton,
        CodeButton,
        linkPlugin.LinkButton,
        Separator,
        HeadlineOneButton,
        HeadlineTwoButton,
        UnorderedListButton,
        OrderedListButton,
        BlockquoteButton,
        CodeBlockButton,
      ]
    });
    const alignmentPlugin = createAlignmentPlugin();
    const markdownShortcutsPlugin = createMarkdownShortcutsPlugin();
    const focusPlugin = createFocusPlugin();
    const resizeablePlugin = createResizeablePlugin();

    const decorator = composeDecorators(
      resizeablePlugin.decorator,
      alignmentPlugin.decorator,
      focusPlugin.decorator,
    );
    const imagePlugin = createImagePlugin({ decorator });
    this.plugins = [inlineToolbarPlugin, alignmentPlugin, markdownShortcutsPlugin, focusPlugin, resizeablePlugin, imagePlugin, linkPlugin];
  }

  // Tries to retrieve a saved state from localStorage, depending on the available information
  getSavedState = () => {
    const document = this.props.document;
    if (document && document._id) { // When restoring the edit state for a specific comment, ask for permission
      const savedState = ls.get(document._id);
      if (savedState && window) {
        const result = window.confirm("We've found a previously saved state for this comment, would you like to restore it?")
        if (result) { return ls.get(document._id) }
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
    console.log("setSavedState state: ", state);
    if (document && document._id) {
      ls.set(document._id, state);
    } else if (document && document.parentCommentId) {
      ls.set('parent:' + document.parentCommentId, state);
    } else if (document && document.postId, state) {
      ls.set('post:' + document.postId, state);
    }
  }

  componentWillMount() {
    //Add function for resetting form to form submit callbacks
    const document = this.props.document;
    const fieldName = this.props.name;



    const resetEditor = (result) => {
      // On Form submit, create a new empty editable
      // let editor = this.props.editor;
      // let state = createEmptyState();
      // editor.trigger.editable.add(state);
      this.setState({
        editorState: EditorState.createEmpty(),
      });

      if (document._id) { ls.remove(document._id) }
      else { ls.remove(fieldName) }

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

  render() {
    // const addValues = this.context.addToAutofilledValues;
    const InlineToolbar = this.plugins[0].InlineToolbar;
    const AlignmentTool = this.plugins[1].AlignmentTool;
    // let editor = this.props.editor;
    const onChange = (editorState) => {
      const contentState = editorState.getCurrentContent();
      this.setSavedState(convertToRaw(contentState));
      // addValues({content: state.getCurrentContent()});
      this.setState({editorState: editorState})
      console.log("Editorstate Test: ", EditorState.createWithContent(contentState));
      // const html = convertToHTML(state.getCurrentContent());
      // console.log("CommentEditor onChange html: ", html)
      return editorState;
    }
    return (
      <div className="commentEditor editor content-body comments-item-text" onClick={this.focus}>
        {/* <Editable editor={editor} id={this.state.contentState.id} onChange={onChange} />
        <Toolbar editor={editor} /> */}
        <Editor
          editorState={this.state.editorState}
          onChange={onChange}
          plugins={this.plugins}
          ref={(element) => { this.editor = element; }}
        />
        <InlineToolbar />
        <AlignmentTool />
      </div>
    )
  }
}

CommentEditor.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
  addToSubmitForm: React.PropTypes.func,
};

registerComponent('CommentEditor', CommentEditor, withEditor);
