import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { getLSHandlers } from './localStorageHandlers.js'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import { htmlToDraft } from '../../lib/editor/utils.js'
import EditorForm from './EditorForm'

class EditorFormContainer extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      editorState: this.initializeContent(),
    };
  }

  getStorageHandlers = () => {
    return getLSHandlers(this.props.form && this.props.form.getLocalStorageId)
  }

  initializeContent = () => {
    let state = {};
    const { document, name } = this.props;
    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getStorageHandlers().get({doc: document, name})
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

  UNSAFE_componentWillMount() {
    const { document, name } = this.props;
    const resetEditor = (result) => {
      // On Form submit, create a new empty editable
      this.setState({
        editorState: EditorState.createEmpty(),
      });
      this.getStorageHandlers().reset({doc: document, name})
      return result;
    }
    this.context.addToSuccessForm(resetEditor);

    const submitRawContentState = (data) => {
      const contentState = this.state.editorState.getCurrentContent();
      if (contentState.hasText()){
        data[name] = convertToRaw(contentState)
      } else {
        data[name] = null;
      }
      return data;
    }
    this.context.addToSubmitForm(submitRawContentState);
  }

  changeCount = 0;

  onChange = (editorState) => {
    const {document, name} = this.props
    const currentContent = this.state.editorState.getCurrentContent()
    const newContent = editorState.getCurrentContent()

    if (currentContent !== newContent) {
      // Only save to localStorage on every 30th content change
      // TODO: Consider debouncing rather than saving every 30th change
      // TODO: Consider saving on blur
      this.changeCount = this.changeCount + 1;
      if (this.changeCount % 30 === 0) {
        const rawContent = convertToRaw(newContent);
        this.getStorageHandlers().set({state: rawContent, doc: document, name})
      }
    }
    this.setState({editorState: editorState})
    return editorState;
  }

  render() {
    const { className } = this.props;
    const { editorState } = this.state;
    return (
      <EditorForm
        isClient={Meteor.isClient}
        editorState={editorState}
        onChange={this.onChange}
        commentEditor={this.props.form && this.props.form.commentEditor}
        className={className}
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
