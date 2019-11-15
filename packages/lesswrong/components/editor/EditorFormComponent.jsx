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
import Tooltip from '@material-ui/core/Tooltip';
import { userHasCkEditor } from '../../lib/betas.js';

const postEditorHeight = 250;
const commentEditorHeight = 100;
const postEditorHeightRows = 15;
const commentEditorHeightRows = 5;

const styles = theme => ({
  editor: {
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
    '& .ck.ck-content': {
      minHeight: postEditorHeight,
    },
    '& .ck-sidebar .ck-content': {
      minHeight: "unset"
    }
  },
  commentEditorHeight: {
    minHeight: commentEditorHeight,
    '& .ck.ck-content': {
      minHeight: commentEditorHeight,
    }
  },
  errorTextColor: {
    color: theme.palette.error.main
  },
  select: {
    marginRight: theme.spacing.unit*1.5
  },
  placeholder: {
    position: "absolute",
    top: 0,
    color: theme.palette.grey[500],
    // Dark Magick
    // https://giphy.com/gifs/psychedelic-art-phazed-12GGadpt5aIUQE
    // Without this code, there's a weird thing where if you try to click the placeholder text, instead of focusing on the editor element, it... doesn't. This is overriding something habryka did to make spoiler tags work. We discussed this for awhile and this seemed like the best option.
    pointerEvents: "none",
    "& *": {
      pointerEvents: "none",
    }
  },
  placeholderCollaborationSpacing: {
    top: 60
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
      version: '',
      ckEditorReference: null,
      ...this.getEditorStatesFromType(editorType)
    }
    this.hasUnsavedData = false;
    this.throttledSaveBackup = _.throttle(this.saveBackup, autosaveInterval, {leading:false});
    this.throttledSetCkEditor = _.throttle(this.setCkEditor, autosaveInterval);

  }

  async componentDidMount() {
    const { currentUser, form } = this.props
    if (userHasCkEditor(currentUser)) {
      let EditorModule = await (form?.commentEditor ? import('../async/CKCommentEditor') : import('../async/CKPostEditor'))
      const Editor = EditorModule.default
      this.ckEditor = Editor
      this.setState({ckEditorLoaded: true})
    }
  }

  getEditorStatesFromType = (editorType, contents) => {
    const { document, fieldName, value } = this.props
    const { editorOverride } = this.state || {} // Provide default value, since we can call this before state is initialized

    if (!editorType) {
      throw new Error('getEditorStateFromType must be supplied an editorType')
    }

    // if contents are manually specified, use those:
    const newValue = contents || value

    // Initialize the editor to whatever the canonicalContent is
    if (newValue?.originalContents?.data && !editorOverride
        && editorType === newValue.originalContents.type)
    {
      return {
        draftJSValue: editorType === "draftJS" ? this.initializeDraftJS(newValue.originalContents.data, editorType) : null,
        markdownValue: editorType === "markdown" ? this.initializeText(newValue.originalContents.data, editorType) : null,
        htmlValue: editorType === "html" ? this.initializeText(newValue.originalContents.data, editorType) : null,
        ckEditorValue: editorType === "ckEditorMarkup" ? this.initializeText(newValue.originalContents.data, editorType) : null
      }
    }
    
    // Otherwise, just set it to the value of the document
    const { draftJS, html, markdown, ckEditorMarkup } = document[fieldName] || {}
    return {
      draftJSValue: editorType === "draftJS" ? this.initializeDraftJS(draftJS, editorType) : null,
      markdownValue: editorType === "markdown" ? this.initializeText(markdown, editorType) : null,
      htmlValue: editorType === "html" ? this.initializeText(html, editorType) : null,
      ckEditorValue: editorType === "ckEditorMarkup" ? this.initializeText(ckEditorMarkup, editorType) : null
    }
  }

  getStorageHandlers = () => {
    const { form } = this.props
    return getLSHandlers(form && form.getLocalStorageId)
  }

  initializeDraftJS = (draftJS, editorType) => {
    const { document, name } = this.props
    let state = {}

    // Check whether we have a state from a previous session saved (in localstorage)
    const savedState = this.getStorageHandlers().get({doc: document, name, prefix:this.getLSKeyPrefix(editorType)})
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

  initializeText = (originalContents, editorType) => {
    const { document, name } = this.props
    const savedState = this.getStorageHandlers().get({doc: document, name, prefix:this.getLSKeyPrefix(editorType)})
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
          if (!this.isDocumentCollaborative()) {
            this.context.addToSuccessForm((s) => {
              this.state.ckEditorReference.setData('')
            }) 
          }
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
    const changed = (this.state.markdownValue !== newContent);
    this.setState({markdownValue: newContent})

    if (changed)
      this.afterChange();
  }

  setCkEditor = (editor) => {
    const newContent = editor.getData()
    const changed = (this.state.ckEditorValue !== newContent);
    this.setState({ckEditorValue: newContent})
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
  getLSKeyPrefix = (editorType) => {
    switch(editorType || this.getCurrentEditorType()) {
      case "draftJS":  return "";
      case "markdown": return "md_";
      case "html":     return "html_";
      case "ckEditorMarkup": return "ckeditor_";
    }
  }

  renderEditorWarning = () => {
    const { classes, currentUser, document, fieldName, value } = this.props
    const { type } = (value && value.originalContents) || (document[fieldName] && document[fieldName].originalContents) || {}
    const defaultType = this.getUserDefaultEditor(currentUser)
    return <div>
        <Typography variant="body2" color="error">
          This document was last edited in {type} format. Showing {this.getCurrentEditorType()} editor.
          <a className={classes.errorTextColor} onClick={() => this.handleEditorOverride(defaultType)}> Click here </a>
          to switch to {defaultType} editor (your default editor).  
        </Typography>
        <br/>
      </div>
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

    const defaultEditor = this.getUserDefaultEditor(currentUser)
    if (defaultEditor === "markdown" && !enableMarkDownEditor) return "draftJS"
    
    return defaultEditor
  }

  getUserDefaultEditor = (user) => {
    if (userHasCkEditor(user)) return "ckEditorMarkup"
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
      className={classes.select}
      disableUnderline
      >
      <MenuItem value={'major'}>Major Update</MenuItem>
      <MenuItem value={'minor'}>Minor Update</MenuItem>
      <MenuItem value={'patch'}>Patch</MenuItem>
    </Select>
  }

  getCurrentRevision = () => {
    return this.state.version || this.props.document.version
  }

  handleUpdateVersionNumber = (version) => {    
    this.setState({ version: version })
  }

  handleUpdateVersion = async (document) => {
    if (!document) return
    if (!document.contents?.originalContents) {
      throw new Error('handleUpdateVersion called with missing document originalContents')
    }
    const editorType = document.contents.originalContents.type
    this.setState({
      ...this.getEditorStatesFromType(editorType, document.contents)
    })
  }

  renderVersionSelect = () => {
    const { classes, document, currentUser } = this.props 
    
    if (!userHasCkEditor(currentUser)) return null

    if (!this.getCurrentRevision()) return null
    return <span className={classes.select}>
        <Components.SelectVersion 
          key={this.getCurrentRevision()}
          documentId={document._id} 
          revisionVersion={this.getCurrentRevision()} 
          updateVersionNumber={this.handleUpdateVersionNumber}
          updateVersion={this.handleUpdateVersion}
        />
      </span>
  }

  renderEditorTypeSelect = () => {
    const { currentUser, classes } = this.props
    if (!userHasCkEditor(currentUser) && !currentUser?.isAdmin) return null
    return (
      <Tooltip title="Warning! Changing format will erase your content" placement="left">
        <Select
            className={classes.select}
            value={this.getCurrentEditorType()}
            onChange={(e) => this.handleEditorOverride(e.target.value)}
            disableUnderline
            >
            {currentUser.isAdmin  && <MenuItem value={'html'}>HTML [Admin Only]</MenuItem>}
            <MenuItem value={'markdown'}>Markdown</MenuItem>
            <MenuItem value={'draftJS'}>Draft-JS</MenuItem>
            <MenuItem value={'ckEditorMarkup'}>LessWrong Docs [Beta]</MenuItem>
          </Select>
      </Tooltip>
    )
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
        return this.renderCkEditor()
      case "draftJS":
        return this.renderDraftJSEditor()
      case "markdown":
        return this.renderPlaintextEditor(currentEditorType)
      case "html":
        return this.renderPlaintextEditor(currentEditorType)
    }
  }

  renderPlaceholder = (showPlaceholder, collaboration) => {
    const { classes, formProps, hintText, placeholder, label  } = this.props

    if (showPlaceholder) {
      return <div className={classNames(this.getBodyStyles(), classes.placeholder, {[classes.placeholderCollaborationSpacing]: collaboration})}>
        { formProps?.editorHintText || hintText || placeholder || label }
      </div>
    }
  }

  isDocumentCollaborative = () => {
    const { document } = this.props
    return document?._id && document?.shareWithUsers
  }

  renderCkEditor = () => {
    const { ckEditorValue, ckEditorReference } = this.state
    const { document, currentUser, formType } = this.props
    const { Loading } = Components
    const CKEditor = this.ckEditor
    const value = ckEditorValue || ckEditorReference?.getData()
  
    if (!this.state.ckEditorLoaded || !CKEditor) {
      return <Loading />
    } else {
      const editorProps = {
        data: value,
        documentId: document?._id,
        formType: formType,
        userId: currentUser?._id,
        onChange: (event, editor) => this.throttledSetCkEditor(editor),
        onInit: editor => this.setState({ckEditorReference: editor})
      }

      // if document is shared with at least one user, it will render the collaborative ckEditor (note: this costs a small amount of money per document) 
      //
      // requires _id because before the draft is saved, ckEditor loses track of what you were writing when turning collaborate on and off (and, meanwhile, you can't actually link people to a shared draft before it's saved anyhow)
      // TODO: figure out a better solution to this problem.
      
      const collaboration = this.isDocumentCollaborative()
      
      return <div className={this.getHeightClass()}>
          { this.renderPlaceholder(!value, collaboration)}
          { collaboration ? 
            <CKEditor key="ck-collaborate" { ...editorProps } collaboration />
            : 
            <CKEditor key="ck-default" { ...editorProps } />}
        </div>
    }
  } 

  renderPlaintextEditor = (editorType) => {
    const { markdownValue, htmlValue } = this.state
    const { classes, multiLine, fullWidth, disableUnderline, startAdornment, form: { commentStyles }, label } = this.props
    const value = (editorType === "html" ? htmlValue : markdownValue) || ""
    return <div>
        { this.renderPlaceholder(!value) }
        <Input
          className={classNames(classes.markdownEditor, this.getBodyStyles(), {[classes.questionWidth]: document.question})}
          value={value}
          onChange={editorType === "html" ? this.setHtml : this.setMarkdown}
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

    return <div>
        { editorWarning }
        <div className={classNames(classes.editor, this.getBodyStyles())}>
          <div>
            { this.renderEditorComponent(currentEditorType) }
          </div>
          { this.renderVersionSelect() }
          { this.renderUpdateTypeSelect() }
          { this.renderEditorTypeSelect() }
        </div>
      </div>
  }
}

EditorFormComponent.contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

registerComponent('EditorFormComponent', EditorFormComponent, withUser, withStyles(styles, { name: "EditorFormComponent" }), withErrorBoundary);
