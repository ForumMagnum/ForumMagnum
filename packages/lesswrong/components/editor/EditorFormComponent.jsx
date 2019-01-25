import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent } from 'meteor/vulcan:core';
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
    const { document, fieldName } = this.props
    const { draftJS, html, markdown } = document[fieldName] || {}
    return {
      draftJSValue: editorType === "draftJS" ? this.initializeDraftJS(draftJS) : null,
      markdownValue: editorType === "markdown" ? markdown : null,
      htmlValue: editorType === "html" ? html : null
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

  UNSAFE_componentWillMount() {
    const { document, name, fieldName } = this.props
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
      }
      return {...submission, [fieldName]: {canonicalContent: {type, data}, updateType}}
    }
    this.context.addToSubmitForm(submitData);

    const resetEditor = (result) => {
      // On Form submit, create a new empty editable
      this.getStorageHandlers().reset({doc: document, name})
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

  handleEditorOverride = () => {
    const { currentUser } = this.props
    const targetEditorType = this.getUserDefaultEditor(currentUser)
    this.setState({
      editorOverride: targetEditorType,
      ...this.getEditorStatesFromType(targetEditorType)
    })
  }

  changeCount = 0
  setDraftJS = (value) => { // Takes in an editorstate
    const { document, name } = this.props
    const { draftJSValue } = this.state
    const newContent = value.getCurrentContent()
    if (draftJSValue !== newContent) {
      // Only save to localStorage on every 30th content change
      // TODO: Consider debouncing rather than saving every 30th change
      // TODO: Consider saving on blur
      this.changeCount = this.changeCount + 1;
      if (this.changeCount % 30 === 0) {
        const rawContent = convertToRaw(newContent);
        this.getStorageHandlers().set({state: rawContent, doc: document, name})
      }
    }
    this.setState({draftJSValue: value})
  }
  setHtml = (e) => {this.setState({htmlValue: e.target.value})}
  setMarkdown = (e) => {this.setState({markdownValue: e.target.value})}

  renderEditorWarning = () => {
    const { classes, currentUser, document } = this.props
    const { type } = document.content || {}
    return <Typography variant="body2" color="primary">
      This document was last edited in {type} format. Showing {this.getCurrentEditorType()} editor.
      <a className={classes.errorTextColor} onClick={this.handleEditorOverride}> Click here </a>
      to switch to {this.getUserDefaultEditor(currentUser)} editor (your default editor).
    </Typography>
  }

  getCurrentEditorType = () => {
    const { editorOverride } = this.state || {} // Since we can call this function before we initialize state
    const { document, currentUser, enableMarkDownEditor, fieldName } = this.props
    const canonicalType = document && document[fieldName] && document[fieldName].canonicalContent.type
    // If there is an override, return that
    if (editorOverride) {return editorOverride}
    // Otherwise, default to rich-text, but maybe show others
    if (canonicalType) {return canonicalType}
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
    if (!currentUser.isAdmin || formType !== "edit") { return null }
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

  render() {
    const { editorOverride, draftJSValue, htmlValue, markdownValue } = this.state
    const { document, currentUser, formType, form, classes, fieldName } = this.props
    const commentStyles = form && form.commentStyles
    const currentEditorType = this.getCurrentEditorType()

    // The class which determines clickable height (as tall as a comment editor,
    // or as tall as a post editor) needs to be applied deeper in the tree, for
    // the draftJS editor; if we apply it to our wrapper div, it'll look right
    // but most of it won't be clickable.
    const heightClass = commentStyles ? classes.commentEditorHeight : classes.postEditorHeight;
    const bodyStyles = (commentStyles && !document.answer) ? classes.commentBodyStyles : classes.postBodyStyles;

    const editorWarning =
      !editorOverride
      && formType !== "new"
      && document && document[fieldName].canonicalContent.type
      && document[fieldName].canonicalContent.type !== this.getUserDefaultEditor(currentUser)
      && this.renderEditorWarning()

    if (this.getCurrentEditorType() === "draftJS") {
      return (
        <div className={classnames(heightClass, classes.root)}>
          { editorWarning }
          <EditorForm
            isClient={Meteor.isClient}
            editorState={draftJSValue}
            onChange={this.setDraftJS}
            commentEditor={form && form.commentEditor}
            className={classnames(bodyStyles, heightClass, {[classes.questionWidth]: document.question})}
          />
          { this.renderUpdateTypeSelect() }
        </div>);
    } else {
      const { multiLine, hintText, placeholder, label, fullWidth, disableUnderline, startAdornment } = this.props
      
      return (
        <div className={classes.root}>
          { editorWarning }
          <div className="mui-text-field">
            <Input
              className={classnames(classes.markdownEditor, bodyStyles, {[classes.questionWidth]: document.question})}
              value={currentEditorType === "html" ? htmlValue : markdownValue}
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
        </div>
      );
    }
  }
}

EditorFormComponent.contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

registerComponent('EditorFormComponent', EditorFormComponent, withUser, withStyles(styles, { name: "EditorFormComponent" }));
