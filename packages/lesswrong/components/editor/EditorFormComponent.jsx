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
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import createBlockBreakoutPlugin from 'draft-js-block-breakout-plugin'
import createDividerPlugin from './editor-plugins/divider';


import {
  createBlockStyleButton,
  ItalicButton,
  BoldButton,
  UnderlineButton,
  BlockquoteButton,
} from 'draft-js-buttons';


import { htmlToDraft } from '../../lib/editor/utils.js'
import ImageButton from './editor-plugins/image/ImageButton.jsx';

class EditorFormComponent extends Component {
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
    const linkifyPlugin = createLinkifyPlugin();
    const blockBreakoutPlugin = createBlockBreakoutPlugin()
    const imagePlugin = createImagePlugin({ decorator });
    this.plugins = [inlineToolbarPlugin, alignmentPlugin, markdownShortcutsPlugin, focusPlugin, resizeablePlugin, imagePlugin, linkPlugin, richButtonsPlugin, linkifyPlugin, blockBreakoutPlugin, dividerPlugin];
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

EditorFormComponent.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
  addToSubmitForm: React.PropTypes.func,
};

registerComponent('EditorFormComponent', EditorFormComponent);
//
//
// import React, { PropTypes, Component } from 'react';
// import { Components, registerComponent } from 'meteor/vulcan:core';
// import { Editable, createEmptyState } from 'ory-editor-core';
// import { Trash, DisplayModeToggle, Toolbar } from 'ory-editor-ui'
// import withEditor from './withEditor.jsx'
// import FlatButton from 'material-ui/FlatButton';
//
// import { connect } from 'react-redux';
// import ls from 'local-storage';
//
// class EditorFormComponent extends Component {
//   constructor(props, context) {
//     super(props,context);
//     const fieldName = this.props.name;
//     let editor = this.props.editor;
//     const document = this.props.document;
//     let state =  || createEmptyState();
//     state = JSON.parse(JSON.stringify(state));
//
//     //Check if we have a saved state in local-storage (from previous session)
//     const savedState = document && document._id ? ls.get(document._id) : ls.get(fieldName);
//     if (savedState) {
//       //We can rely on window being available here since localStorage will never be accessed on the server
//       const result = !document._id || window.confirm("We've found a previously saved state for this editor, would you like to restore it?")
//       if (result) {state = savedState}
//     }
//
//     this.state = {
//       [fieldName]: state,
//       active: !document.legacy,
//       displayModeOpen: false,
//     };
//     editor.trigger.editable.add(state);
//   }
//
//   componentWillMount() {
//     //Add function for resetting form to form submit callbacks
//     const fieldName = this.props.name;
//     const document = this.props.document;
//     const resetEditor = (result) => {
//       // On Form submit, create a new empty editable
//       let editor = this.props.editor;
//       let state = createEmptyState();
//       editor.trigger.editable.add(state);
//       this.setState({
//         [fieldName]: state,
//       });
//       // On form success, remove cached version from localStorage
//       if (document._id) { ls.remove(document._id) }
//       else { ls.remove(fieldName) }
//
//       return result;
//     }
//     this.context.addToSuccessForm(resetEditor);
//
//
//     const checkForActive = (data) => {
//       if (!this.state.active) {
//         data[fieldName] = null;
//       }
//       return data;
//     }
//
//     this.context.addToSubmitForm(checkForActive);
//   }
//
//   onChange = (state) => {
//     const document = this.props.document;
//     const fieldName = this.props.name;
//     const addValues = this.context.addToAutofilledValues;
//     addValues({[fieldName]: state});
//     document && document._id ? ls.set(document._id, state) : ls.set(fieldName, state);
//   }
//
//   activateEditor = () => {this.setState({active: true})}
//
//   deactivateEditor = () => {this.setState({active: false})}
//
//   toggleEditor = () => {this.setState({active: !this.state.active})}
//
//   toggleDisplayMode = () => {this.setState({displayModeOpen: !this.state.displayModeOpen})}
//
//   render() {
//     const fieldName = this.props.name;
//     let editor = this.props.editor;
//     return (
//       <div className="commentEditor">
//         {this.props.document.legacy ?
//           <div className="row">
//             <FlatButton
//               backgroundColor={this.state.active ? "#555" : "#999"}
//               hoverColor={this.state.active ? "#666" : "#aaa"}
//               style={{color: "#fff"}}
//               label={this.state.active ? "Deactivate Editor" : "Activate Editor"}
//               onTouchTap={this.toggleEditor}/>
//           </div> : null
//         }
//         <br/>
//         <div className="row">
//           {this.state.active ?
//             <div className="content-body">
//               <Editable
//                 id={this.state[fieldName].id}
//                 editor={editor}
//                 onChange={this.onChange} />
//               <Toolbar editor={editor}></Toolbar>
//               { this.props.name == "content" && <div><Trash editor={editor} /></div> }
//               { this.props.showAdvancedEditor && <DisplayModeToggle editor={editor} /> }
//             </div> : null}
//         </div>
//       </div>
//     )
//   }
// }
//
// EditorFormComponent.contextTypes = {
//   addToAutofilledValues: React.PropTypes.func,
//   addToSuccessForm: React.PropTypes.func,
//   addToSubmitForm: React.PropTypes.func,
// };
//
//
// const mapStateToProps = state => ({ showAdvancedEditor: state.showAdvancedEditor });
//
// registerComponent("EditorFormComponent", EditorFormComponent, withEditor, connect(mapStateToProps));
