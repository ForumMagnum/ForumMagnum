import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ls from 'local-storage';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { htmlToDraft } from '../../lib/editor/utils.js'
import EditorForm from './EditorForm';

class EditorFormContainer extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      editorState: this.initializeContent(),
    };
  }

  initializeContent = () => {
    let state = {};
    const { document, name } = this.props;
    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getSavedState();
    if (savedState) {
      try {
        // eslint-disable-next-line no-console
        console.log("Restoring saved document state: ", savedState);
        state = EditorState.createWithContent(convertFromRaw(savedState))
        return state;
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    }

    if (document && !_.isEmpty(document[name])) {
      try {
        state = EditorState.createWithContent(convertFromRaw(document[name]));
        return state;
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error("Invalid document content, trying to restore from HTML instead", document);
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

  UNSAFE_componentWillMount() {
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

  changeCount = 0;

  onChange = (editorState) => {
    const currentContent = this.state.editorState.getCurrentContent()
    const newContent = editorState.getCurrentContent()

    if (currentContent !== newContent) {
      // Only save to localStorage on every 30th content change
      // TODO: Consider debouncing rather than saving every 30th change
      // TODO: Consider saving on blur
      this.changeCount = this.changeCount + 1;
      if (this.changeCount % 30 === 0) {
        const rawContent = convertToRaw(editorState.getCurrentContent());
        this.setSavedState(rawContent);
      }
    }
    this.setState({editorState: editorState})
    return editorState;
  }

  render() {
    const { editorState } = this.state;

    return (

      <EditorForm
        isClient={Meteor.isClient}
        editorState={editorState}
        onChange={this.onChange}
      />
    )
  }
}

EditorFormContainer.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

export default EditorFormContainer;
