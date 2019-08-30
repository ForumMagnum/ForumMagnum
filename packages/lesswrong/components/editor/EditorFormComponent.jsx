import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import { editorStyles, postBodyStyles, postHighlightStyles, commentBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import classNames from 'classnames';
import Input from '@material-ui/core/Input';
import { getLSHandlers } from '../async/localStorageHandlers'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import EditorForm from '../async/EditorForm'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import withErrorBoundary from '../common/withErrorBoundary';

const postEditorHeight = 250;
const commentEditorHeight = 100;
const postEditorHeightRows = 15;
const commentEditorHeightRows = 5;

const styles = theme => ({
  root: {
    position: 'relative',
  },
  postBodyStyles: {
    ...editorStyles(theme, postBodyStyles),
    cursor: "text",
    maxWidth: 640,
    padding: 0,
    '& li .public-DraftStyleDefault-block': {
      margin: 0
    }
  },

  answerStyles: {
    ...editorStyles(theme, postHighlightStyles),
    cursor: "text",
    maxWidth:620,
    '& li .public-DraftStyleDefault-block': {
      margin: 0
    }
  },

  commentBodyStyles: {
    ...editorStyles(theme, commentBodyStyles),
    cursor: "text",
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
    pointerEvents: 'auto'
  },
  questionWidth: {
    width: 640,
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
  },
  placeholder: {
    position: "absolute",
    top: 0,
    color: theme.palette.grey[500],
    // Dark Magick
    // https://giphy.com/gifs/psychedelic-art-phazed-12GGadpt5aIUQE
    pointerEvents: "none",
    "& *": {
      pointerEvents: "none",
    }
  }
})

const autosaveInterval = 3000; //milliseconds

class EditorFormComponent extends Component {
  constructor(props) {
    super(props)
    const editorType = this.getCurrentEditorType()
    this.state = {
      editorOverride: null,
      ckEditorLoaded: null,
      updateType: 'minor',
      ckEditorReference: null,
      ...this.getEditorStatesFromType(editorType)
    }
    this.hasUnsavedData = false;
    this.throttledSaveBackup = _.throttle(this.saveBackup, autosaveInterval, {leading:false});
  }

  async componentDidMount() {
    const { currentUser, form } = this.props
    if (currentUser?.isAdmin) {
      let EditorModule = await (form?.commentEditor ? import('../async/CKCommentEditor') : import('../async/CKPostEditor'))
      const Editor = EditorModule.default
      this.ckEditor = Editor
      this.setState({ckEditorLoaded: true})
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
        htmlValue: editorType === "html" ? this.initializeText(value.originalContents.data) : null,
        ckEditorValue: editorType === "ckEditorMarkup" ? this.initializeText(value.originalContents.data) : null
      }
    }

    // Otherwise, just set it to the value of the document
    const { draftJS, html, markdown, ckEditorMarkup } = document[fieldName] || {}
    return {
      draftJSValue: editorType === "draftJS" ? this.initializeDraftJS(draftJS) : null,
      markdownValue: editorType === "markdown" ? this.initializeText(markdown) : null,
      htmlValue: editorType === "html" ? this.initializeText(html) : null,
      ckEditorValue: editorType === "ckEditorMarkup" ? this.initializeText(ckEditorMarkup) : null
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
        const contentState = convertFromRaw(savedState)
        if (contentState.hasText()) {
          return EditorState.createWithContent(contentState)
        } else {
          // eslint-disable-next-line no-console
          console.log("Not restoring empty document state: ", contentState)
        }
        
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
      const { draftJSValue, markdownValue, htmlValue, updateType, ckEditorReference } = this.state
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
        case "ckEditorMarkup":
          if (!ckEditorReference) throw Error("Can't submit ckEditorMarkup without attached CK Editor")
          data = ckEditorReference.getData()
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
        ckEditorValue: null
      });
      return result;
    }
    this.context.addToSuccessForm(resetEditor);

    if (Meteor.isClient && window) {
      this.unloadEventListener = window.addEventListener("beforeunload", (ev) => {
        if (this.hasUnsavedData) {
          ev.preventDefault();
          ev.returnValue = 'Are you sure you want to close?';
          return ev.returnValue
        }
      });
    }
  }

  componentWillUnmount() {
    if (this.unloadEventListener) {
      window.removeEventListener(this.unloadEventListener);
    }
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
      this.afterChange();
    }
  }

  setHtml = (eventOrHtml) => {
    const newContent = (typeof eventOrHtml === "string") ? eventOrHtml : eventOrHtml.target.value 
    const changed = (this.state.htmlValue !== newContent);
    this.setState({htmlValue: newContent})

    if (changed)
      this.afterChange();
  }

  setMarkdown = (e) => {
    const newContent = e.target.value
    const changed = (this.state.htmlValue !== newContent);
    this.setState({markdownValue: newContent})

    if (changed)
      this.afterChange();
  }

  afterChange = () => {
    this.hasUnsavedData = true;
    this.throttledSaveBackup();
  }

  saveBackup = () => {
    const { document, name } = this.props;

    const serialized = this.editorContentsToJson();

    const success = this.getStorageHandlers().set({
      state: serialized,
      doc: document,
      name,
      prefix: this.getLSKeyPrefix()
    });

    if (success) {
      this.hasUnsavedData = false;
    }
    return success;
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
      case "ckEditorMarkup":
        return this.state.ckEditorValue;
    }
  }

  // Get an editor-type-specific prefix to use on localStorage keys, to prevent
  // drafts written with different editors from having conflicting names.
  getLSKeyPrefix = () => {
    switch(this.getCurrentEditorType()) {
      case "draftJS":  return "";
      case "markdown": return "md_";
      case "html":     return "html_";
      case "ckEditorMarkup": return "ckeditor_";
    }
  }

  renderEditorWarning = () => {
    const { classes, currentUser, document, fieldName, value } = this.props
    const { type } = (value && value.originalContents) || (document[fieldName] && document[fieldName].originalContents) || {}
    return <Typography variant="body1" color="primary">
      This document was last edited in {type} format. Showing {this.getCurrentEditorType()} editor.
      <a className={classes.errorTextColor} onClick={() => this.handleEditorOverride()}> Click here </a>
      to switch to {this.getUserDefaultEditor(currentUser)} editor (your default editor).
    </Typography>
  }

  getCurrentEditorType = () => {
    const { editorOverride } = this.state || {} // Provide default since we can call this function before we initialize state
    const { document, currentUser, enableMarkDownEditor, fieldName, value } = this.props
    const originalType = document?.[fieldName]?.originalContents?.type
    // If there is an override, return that
    if (editorOverride) { return editorOverride }
    // Then check whether we are directly passed a value in the form context, with a type (as a default value for example)
    if (value && value.originalContents && value.originalContents.type) {
      return value.originalContents.type
    }
    // Otherwise, default to rich-text, but maybe show others
    if (originalType) { return originalType }
    else if (currentUser?.defaultToCKEditor) { return "ckEditorMarkup" }

    const defaultEditor = this.getUserDefaultEditor(currentUser)
    if (defaultEditor === "markdown" && !enableMarkDownEditor) return "draftJS"
    
    return defaultEditor
  }

  getUserDefaultEditor = (user) => {
    if (user?.defaultToCKEditor) return "ckEditorMarkup"
    if (Users.useMarkdownPostEditor(user)) return "markdown"
    return "draftJS"
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
      <MenuItem value={'ckEditorMarkup'}>CK Editor</MenuItem>
    </Select>
  }

  getBodyStyles = () => {
    const { classes, commentStyles, document } = this.props
    if (commentStyles && document.answer) return classes.answerStyles
    if (commentStyles) return classes.commentBodyStyles
    return classes.postBodyStyles
  }

  renderEditorComponent = (currentEditorType) => {
    switch (currentEditorType) {
      case "ckEditorMarkup":
        return this.renderCkEditor(currentEditorType)
      case "draftJS":
        return this.renderDraftJSEditor(currentEditorType)
      case "markdown":
        return this.renderPlaintextEditor(currentEditorType)
      case "html":
        return this.renderPlaintextEditor(currentEditorType)
    }
  }

  renderPlaceholder = (showPlaceholder) => {
    const { classes, formProps, hintText, placeholder, label  } = this.props

    if (showPlaceholder) {
      return <div className={classNames(this.getBodyStyles(), classes.placeholder)}>
        { formProps?.editorHintText || hintText || placeholder || label }
      </div>
    }
  }

  renderCkEditor = () => {
    const { ckEditorValue } = this.state
    const { document, currentUser, formType } = this.props
    const { Loading } = Components
    const CKEditor = this.ckEditor
    if (!this.state.ckEditorLoaded || !CKEditor) {
      return <Loading />
    } else {
      return <CKEditor 
            data={ckEditorValue}
            documentId={document._id}
            formType={formType}
            userId={currentUser._id}
            onInit={editor => this.setState({ckEditorReference: editor})}
          />
    }
  }

  renderPlaintextEditor = () => {
    const { markdownValue } = this.state
    const { classes, multiLine, fullWidth, disableUnderline, startAdornment, form: { commentStyles }, label } = this.props
    const value = markdownValue || ""
    return <div>
        { this.renderPlaceholder(!value) }
        <Input
          className={classNames(classes.markdownEditor, this.getBodyStyles(), {[classes.questionWidth]: document.question})}
          value={value}
          onChange={this.setMarkdown}
          multiline={multiLine}
          rows={commentStyles ? commentEditorHeightRows : postEditorHeightRows}
          rowsMax={99999}
          fullWidth={fullWidth}
          disableUnderline={disableUnderline}
          startAdornment={startAdornment}
          label={label}
        />
      </div>
  }

  renderDraftJSEditor = () => {
    const { draftJSValue } = this.state
    const { document, form, classes } = this.props
    const showPlaceholder = !(draftJSValue?.getCurrentContent && draftJSValue.getCurrentContent().hasText())

    return <div>
        { this.renderPlaceholder(showPlaceholder) }
        <EditorForm
          isClient={Meteor.isClient}
          editorState={draftJSValue}
          onChange={this.setDraftJS}
          commentEditor={form?.commentEditor}
          className={classNames(this.getBodyStyles(), this.getHeightClass(), {[classes.questionWidth]: document.question})}
        />
      </div>
  }

  getHeightClass = () => {
    const { document, classes, form: { commentStyles } } = this.props
    if (commentStyles || document.question) {
      return classes.commentEditorHeight
    } else {
      return classes.postEditorHeight
    }
  }

  render() {
    const { editorOverride } = this.state
    const { document, currentUser, formType, classes, fieldName } = this.props
    const currentEditorType = this.getCurrentEditorType()

    if (!document) return null;

    const editorWarning =
      !editorOverride
      && formType !== "new"
      && document[fieldName] && document[fieldName].originalContents && document[fieldName].originalContents.type
      && document[fieldName].originalContents.type !== this.getUserDefaultEditor(currentUser)
      && this.renderEditorWarning()

    return <div className={classNames(classes.root, this.getBodyStyles())}>
      { editorWarning }
      <div>
        { this.renderEditorComponent(currentEditorType) }
      </div>
      { this.renderUpdateTypeSelect() }
      { this.renderEditorTypeSelect() }
    </div>
  }
}

EditorFormComponent.contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

registerComponent('EditorFormComponent', EditorFormComponent, withUser, withStyles(styles, { name: "EditorFormComponent" }), withErrorBoundary);
