import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import { editorStyles, postBodyStyles, commentBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import classnames from 'classnames';
import Input from '@material-ui/core/Input';
import { getLSHandlers } from '../async/localStorageHandlers'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import EditorForm from '../async/EditorForm'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import withErrorBoundary from '../common/withErrorBoundary'

const postEditorHeight = 250;
const commentEditorHeight = 100;
const postEditorHeightRows = 15;
const commentEditorHeightRows = 5;

const styles = theme => ({
  root: {
    position: 'relative'
  },
  postBodyStyles: {
    ...editorStyles(theme, postBodyStyles),
    cursor: "text",
    maxWidth:640,
  },

  commentBodyStyles: {
    ...editorStyles(theme, commentBodyStyles),
    cursor: "text",
    margin: 0,
    padding: 0,
    pointerEvents: 'auto'
  },
  questionWidth: {
    width: 540,
    [theme.breakpoints.down('sm')]: {
      width: 'inherit'
    }
  },
  postEditorHeight: {
    minHeight: postEditorHeight,
  },
  commentEditorHeight: {
    minHeight: commentEditorHeight,
  },
  errorTextColor: {
    color: theme.palette.error.main
  },
  updateTypeSelect: {
    marginBottom: 10
  }
})

class EditorFormComponent extends Component {
  constructor(props) {
    super(props)
    const editorType = this.getCurrentEditorType()
    this.state = {
      editorOverride: null,
      updateType: 'minor',
      ...this.getEditorStatesFromType(editorType)
    }
  }

  getEditorStatesFromType = (editorType) => {
    const { document, fieldName, value } = this.props
    const { editorOverride } = this.state || {} // Provide default value, since we can call this before state is initialized

    // Initialize the editor to whatever the canonicalContent is
    if (value && value.originalContents && value.originalContents.data
        && !editorOverride
        && editorType === value.originalContents.type)
    {
      return {
        draftJSValue: editorType === "draftJS" ? this.initializeDraftJS(value.originalContents.data) : null,
        markdownValue: editorType === "markdown" ? this.initializeText(value.originalContents.data) : null,
        htmlValue: editorType === "html" ? this.initializeText(value.originalContents.data) : null
      }
    }

    // Otherwise, just set it to the value of the document
    const { draftJS, html, markdown } = document[fieldName] || {}
    return {
      draftJSValue: editorType === "draftJS" ? this.initializeDraftJS(draftJS) : null,
      markdownValue: editorType === "markdown" ? this.initializeText(markdown) : null,
      htmlValue: editorType === "html" ? this.initializeText(html) : null
    }
  }

  getStorageHandlers = () => {
    const { form } = this.props
    return getLSHandlers(form && form.getLocalStorageId)
  }

  initializeDraftJS = (draftJS) => {
    const { document, name } = this.props
    let state = {}

    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getStorageHandlers().get({doc: document, name, prefix:this.getLSKeyPrefix()})
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

    // Otherwise initialize from the database state
    if (draftJS) {
      try {
        state = EditorState.createWithContent(convertFromRaw(draftJS));
        return state;
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error("Invalid document content", document);
      }
    }

    // And lastly, if the field is empty, create an empty draftJS object
    return EditorState.createEmpty();
  }
  
  initializeText = (originalContents) => {
    const { document, name } = this.props
    const savedState = this.getStorageHandlers().get({doc: document, name, prefix:this.getLSKeyPrefix()})
    if (savedState) {
      return savedState;
    }
  
    return originalContents;
  }

  UNSAFE_componentWillMount() {
    const { document, fieldName } = this.props
    const submitData = (submission) => {
      let data = null
      const { draftJSValue, markdownValue, htmlValue, updateType} = this.state
      const type = this.getCurrentEditorType()
      switch(type) {
        case "draftJS":
          const draftJS = draftJSValue.getCurrentContent()
          data = draftJS.hasText() ? convertToRaw(draftJS) : null
          break
        case "markdown":
          data = markdownValue
          break
        case "html":
          data = htmlValue
          break
        default:
          // eslint-disable-next-line no-console
          console.error(`Unrecognized editor type: ${type}`);
          data = "";
          break;
      }
      return {...submission, [fieldName]: data ? {originalContents: {type, data}, updateType} : undefined}
    }
    this.context.addToSubmitForm(submitData);

    const resetEditor = (result) => {
      const { name } = this.props;
      // On Form submit, create a new empty editable
      this.getStorageHandlers().reset({doc: document, name, prefix:this.getLSKeyPrefix()})
      this.setState({
        draftJSValue: this.initializeDraftJS(),
        htmlValue: null,
        markdownValue: null,
        editorOverride: null,
      });
      return result;
    }
    this.context.addToSuccessForm(resetEditor);
  }

  handleEditorOverride = (editorType) => {
    const { currentUser } = this.props
    const targetEditorType = editorType || this.getUserDefaultEditor(currentUser)
    this.setState({
      editorOverride: targetEditorType,
      ...this.getEditorStatesFromType(targetEditorType)
    })
  }

  changeCount = 0
  setDraftJS = (value) => { // Takes in an editorstate
    const { draftJSValue } = this.state
    const currentContent = draftJSValue.getCurrentContent()
    const newContent = value.getCurrentContent()
    const changed = (currentContent !== newContent);
    this.setState({draftJSValue: value})
    
    if (changed) {
      this.maybeSaveBackup();
    }
  }
  
  setHtml = (e) => {
    const newContent = e.target.value
    const changed = (this.state.htmlValue !== newContent);
    this.setState({htmlValue: newContent})
    
    if (changed)
      this.maybeSaveBackup();
  }
  
  setMarkdown = (e) => {
    const newContent = e.target.value
    const changed = (this.state.htmlValue !== newContent);
    this.setState({markdownValue: newContent})
    
    if (changed)
      this.maybeSaveBackup();
  }
  
  maybeSaveBackup = () => {
    const { document, name } = this.props;
    
    // Only save to localStorage on every 30th content change
    // TODO: Consider debouncing rather than saving every 30th change
    // TODO: Consider saving on blur
    this.changeCount = this.changeCount + 1;
    if (this.changeCount % 30 === 0) {
      const serialized = this.editorContentsToJson();
      
      this.getStorageHandlers().set({
        state: serialized,
        doc: document,
        name,
        prefix: this.getLSKeyPrefix()
      })
    }
  }
  
  // Take the editor contents (whichever editor you're using), and return
  // something JSON (ie, a JSON object or a string) which represents the
  // content and can be saved to localStorage.
  editorContentsToJson = () => {
    switch(this.getCurrentEditorType()) {
      case "draftJS":
        const draftJScontent = this.state.draftJSValue.getCurrentContent()
        return convertToRaw(draftJScontent);
      case "markdown":
        return this.state.markdownValue;
      case "html":
        return this.state.htmlValue;
    }
  }
  
  // Get an editor-type-specific prefix to use on localStorage keys, to prevent
  // drafts written with different editors from having conflicting names.
  getLSKeyPrefix = () => {
    switch(this.getCurrentEditorType()) {
      case "draftJS":  return "";
      case "markdown": return "md_";
      case "html":     return "html_";
    }
  }

  renderEditorWarning = () => {
    const { classes, currentUser, document, fieldName, value } = this.props
    const { type } = (value && value.originalContents) || (document[fieldName] && document[fieldName].originalContents) || {}
    return <Typography variant="body2" color="primary">
      This document was last edited in {type} format. Showing {this.getCurrentEditorType()} editor.
      <a className={classes.errorTextColor} onClick={this.handleEditorOverride}> Click here </a>
      to switch to {this.getUserDefaultEditor(currentUser)} editor (your default editor).
    </Typography>
  }

  getCurrentEditorType = () => {
    const { editorOverride } = this.state || {} // Provide default since we can call this function before we initialize state
    const { document, currentUser, enableMarkDownEditor, fieldName, value } = this.props
    const originalType = document && document[fieldName] && document[fieldName].originalContents && document[fieldName].originalContents.type
    // If there is an override, return that
    if (editorOverride) { return editorOverride }
    // Then check whether we are directly passed a value in the form context, with a type (as a default value for example)
    if (value && value.originalContents && value.originalContents.type) {
      return value.originalContents.type
    }
    // Otherwise, default to rich-text, but maybe show others
    if (originalType) { return originalType }
    else if (enableMarkDownEditor && Users.useMarkdownPostEditor(currentUser)){
      return "markdown"
    } else {
      return "draftJS"
    }
  }

  getUserDefaultEditor = (user) => {
    if (Users.useMarkdownPostEditor(user)) {
      return "markdown"
    } else {
      return "draftJS"
    }
  }

  handleUpdateTypeSelect = (e) => {
    this.setState({ updateType: e.target.value })
  }

  renderUpdateTypeSelect = () => {
    const { currentUser, formType, classes } = this.props
    if (!currentUser || !currentUser.isAdmin || formType !== "edit") { return null }
    return <Select
      value={this.state.updateType}
      onChange={this.handleUpdateTypeSelect}
      className={classes.updateTypeSelect}
      >
      <MenuItem value={'major'}>Major Update</MenuItem>
      <MenuItem value={'minor'}>Minor Update</MenuItem>
      <MenuItem value={'patch'}>Patch</MenuItem>
    </Select>
  }

  renderEditorTypeSelect = () => {
    const { currentUser, classes } = this.props
    if (!currentUser || !currentUser.isAdmin) return null
    return <Select
      value={this.getCurrentEditorType()}
      onChange={(e) => this.handleEditorOverride(e.target.value)}
      className={classes.updateTypeSelect}
      >
      <MenuItem value={'html'}>HTML</MenuItem>
      <MenuItem value={'markdown'}>Markdown</MenuItem>
      <MenuItem value={'draftJS'}>Draft-JS</MenuItem>
    </Select>
  }

  render() {
    const { editorOverride, draftJSValue, htmlValue, markdownValue } = this.state
    const { document, currentUser, formType, form, classes, fieldName } = this.props
    const commentStyles = form && form.commentStyles
    const currentEditorType = this.getCurrentEditorType()
    
    if (!document) return null;

    // The class which determines clickable height (as tall as a comment editor,
    // or as tall as a post editor) needs to be applied deeper in the tree, for
    // the draftJS editor; if we apply it to our wrapper div, it'll look right
    // but most of it won't be clickable.
    const heightClass = commentStyles ? classes.commentEditorHeight : classes.postEditorHeight;
    const bodyStyles = (commentStyles && !document.answer) ? classes.commentBodyStyles : classes.postBodyStyles;

    const editorWarning =
      !editorOverride
      && formType !== "new"
      && document[fieldName] && document[fieldName].originalContents && document[fieldName].originalContents.type
      && document[fieldName].originalContents.type !== this.getUserDefaultEditor(currentUser)
      && this.renderEditorWarning()

    if (this.getCurrentEditorType() === "draftJS" && draftJSValue) {
      return (
        <div className={classnames(heightClass, classes.root, "editor-form-component")}>
          { editorWarning }
          <EditorForm
            isClient={Meteor.isClient}
            editorState={draftJSValue}
            onChange={this.setDraftJS}
            commentEditor={form && form.commentEditor}
            className={classnames(bodyStyles, heightClass, {[classes.questionWidth]: document.question})}
          />
          { this.renderUpdateTypeSelect() }
          { this.renderEditorTypeSelect() }
        </div>);
    } else {
      const { multiLine, hintText, placeholder, label, fullWidth, disableUnderline, startAdornment } = this.props
      
      return (
        <div className={classnames(classes.root, "editor-form-component")}>
          { editorWarning }
          <div className="mui-text-field">
            <Input
              className={classnames(classes.markdownEditor, bodyStyles, {[classes.questionWidth]: document.question})}
              value={currentEditorType === "html" ? (htmlValue || "") : (markdownValue || "")}
              onChange={currentEditorType === "html" ? this.setHtml : this.setMarkdown}
              multiline={multiLine}
              rows={commentStyles ? commentEditorHeightRows : postEditorHeightRows}
              placeholder={hintText || placeholder || label}
              rowsMax={99999}
              fullWidth={fullWidth}
              disableUnderline={disableUnderline}
              startAdornment={startAdornment}
              label={label}
            /><br />
          </div>
          { this.renderUpdateTypeSelect() }
          { this.renderEditorTypeSelect() }
        </div>
      );
    }
  }
}

EditorFormComponent.contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

registerComponent('EditorFormComponent', EditorFormComponent, withUser, withStyles(styles, { name: "EditorFormComponent" }), withErrorBoundary);
