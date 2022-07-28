import React, { Component, Ref } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userUseMarkdownPostEditor } from '../../lib/collections/users/helpers';
import { editorStyles, ckEditorStyles } from '../../themes/stylePiping'
import withUser from '../common/withUser';
import classNames from 'classnames';
import Input from '@material-ui/core/Input';
import { getLSHandlers } from '../async/localStorageHandlers'
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import withErrorBoundary from '../common/withErrorBoundary';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import { userHasCkCollaboration, userCanCreateCommitMessages } from '../../lib/betas';
import * as _ from 'underscore';
import { isClient } from '../../lib/executionEnvironment';
import { forumTypeSetting } from '../../lib/instanceSettings';
import FormLabel from '@material-ui/core/FormLabel';
import { markdownToHtmlSimple } from '../../lib/editor/utils';

const postEditorHeight = 250;
const questionEditorHeight = 150;
const commentEditorHeight = 100;
const postEditorHeightRows = 15;
const commentEditorHeightRows = 5;

const styles = (theme: ThemeType): JssStyles => ({
  label: {
    display: 'block',
    fontSize: 10,
    marginBottom: 6
  },
  editor: {
    position: 'relative',
  },
  markdownEditor: {
    fontFamily: "inherit",
    fontSize: "inherit",
  },
  postBodyStyles: {
    ...editorStyles(theme),
    cursor: "text",
    padding: 0,
    '& li .public-DraftStyleDefault-block': {
      margin: 0
    }
  },

  answerStyles: {
    ...editorStyles(theme),
    cursor: "text",
    maxWidth:620,
    '& li .public-DraftStyleDefault-block': {
      margin: 0
    }
  },

  commentBodyStyles: {
    ...editorStyles(theme),
    cursor: "text",
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
    pointerEvents: 'auto'
  },
  ckEditorStyles: {
    ...ckEditorStyles(theme),
  },
  questionWidth: {
    width: 640,
    [theme.breakpoints.down('sm')]: {
      width: '100%'
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
  questionEditorHeight: {
    minHeight: questionEditorHeight,
    '& .ck.ck-content': {
      minHeight: questionEditorHeight,
    }
  },
  maxHeight: {
    maxHeight: "calc(100vh - 450px)",
    overflowY: "scroll"
  },
  clickHereColor: {
    color: theme.palette.primary.main
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
  },
  changeDescriptionRow: {
    display: "flex",
    alignItems: "center",
  },
  changeDescriptionLabel: {
    marginLeft: 8,
    marginRight: 8,
    ...theme.typography.commentStyle,
    color: theme.palette.text.normal,
  },
  changeDescriptionInput: {
    flexGrow: 1,
  },
  markdownImgErrText: {
    margin: `${theme.spacing.unit * 3}px 0`,
    color: theme.palette.error.main,
  },
  lastEditedWarning: {
    color: theme.palette.error.main,
  },
})

const autosaveInterval = 3000; //milliseconds
const checkImgErrsInterval = 500; //milliseconds
const ckEditorName = forumTypeSetting.get() === 'EAForum' ? 'EA Forum Docs' : 'LessWrong Docs'
const editorTypeToDisplay = {
  html: {name: 'HTML', postfix: '[Admin Only]'},
  ckEditorMarkup: {name: ckEditorName, postfix: '[Beta]'},
  markdown: {name: 'Markdown'},
  draftJS: {name: 'Draft-JS'},
}
const nonAdminEditors = ['ckEditorMarkup', 'markdown', 'draftJS']
const adminEditors = ['html', 'ckEditorMarkup', 'markdown', 'draftJS']

interface EditorFormComponentProps extends WithUserProps, WithStylesProps {
  form: any,
  formType: any,
  formProps: any,
  document: any,
  name: any,
  fieldName: any,
  value: any,
  hintText: string,
  placeholder: string,
  label: string,
  commentStyles: boolean,
  collectionName: string,
  addToSubmitForm?: Function,
  addToSuccessForm?: Function,
}
interface EditorFormComponentState {
  editorOverride: any,
  ckEditorLoaded: any,
  updateType: string,
  commitMessage: string,
  ckEditorReference: any,
  loading: boolean,
  draftJSValue: any,
  ckEditorValue: any,
  markdownValue: any,
  htmlValue: any,
  markdownImgErrs: boolean,
}

class EditorFormComponent extends Component<EditorFormComponentProps,EditorFormComponentState> {
  hasUnsavedData: boolean
  throttledSaveBackup: any
  throttledSetCkEditor: any
  debouncedCheckMarkdownImgErrs: any
  unloadEventListener: any
  ckEditor: any

  constructor(props: EditorFormComponentProps) {
    super(props)
    const editorType = this.getCurrentEditorType()
    this.state = {
      editorOverride: null,
      ckEditorLoaded: null,
      updateType: 'minor',
      commitMessage: "",
      ckEditorReference: null,
      loading: true,
      ...this.getEditorStatesFromType(editorType),
      markdownImgErrs: false,
    }
    this.hasUnsavedData = false;
    this.throttledSaveBackup = _.throttle(this.saveBackup, autosaveInterval, {leading:false});
    this.throttledSetCkEditor = _.throttle(this.setCkEditor, autosaveInterval);
    this.debouncedCheckMarkdownImgErrs = _.debounce(this.checkMarkdownImgErrs, checkImgErrsInterval);

  }

  async componentDidMount() {
    const { form } = this.props

    this.context.addToSubmitForm && this.context.addToSubmitForm(this.submitData);
    this.context.addToSuccessForm && this.context.addToSuccessForm((result) => {
      this.resetEditor();
      return result;
    });

    this.props.addToSubmitForm && this.props.addToSubmitForm(this.submitData)
    this.props.addToSuccessForm && this.props.addToSuccessForm((result) => {
      this.resetEditor();
      return result;
    });

    if (isClient && window) {
      this.unloadEventListener = (ev) => {
        if (this.hasUnsavedData) {
          ev.preventDefault();
          ev.returnValue = 'Are you sure you want to close?';
          return ev.returnValue
        }
      }
      window.addEventListener("beforeunload", this.unloadEventListener );
    }

    let EditorModule = await (form?.commentEditor ? import('../async/CKCommentEditor') : import('../async/CKPostEditor'))
    const Editor = EditorModule.default
    this.ckEditor = Editor
    this.setState({ckEditorLoaded: true})
    
    if (isClient) {
      this.restoreFromLocalStorage();
      this.setState({loading: false})
    }
  }
  
  setEditorValue(newValue: string) {
    const html = markdownToHtmlSimple(newValue)
    this.setState({
      markdownValue: newValue,
      htmlValue: html,
      ckEditorValue: html
    })
    this.state.ckEditorReference?.setData(html)
  }

  getEditorStatesFromType = (editorType: string, contents?: any) => {
    const { document, fieldName, value } = this.props
    const { editorOverride } = this.state || {} // Provide default value, since we can call this before state is initialized

    // if contents are manually specified, use those:
    const newValue = contents || value

    // Initialize the editor to whatever the canonicalContent is
    if (newValue?.originalContents?.data
        && !editorOverride
        && editorType === newValue.originalContents.type)
    {
      return {
        draftJSValue:  editorType === "draftJS"        ? this.initializeDraftJS(newValue.originalContents.data) : null,
        markdownValue: editorType === "markdown"       ? newValue.originalContents.data : null,
        htmlValue:     editorType === "html"           ? newValue.originalContents.data : null,
        ckEditorValue: editorType === "ckEditorMarkup" ? newValue.originalContents.data : null
      }
    }

    // Otherwise, just set it to the value of the document
    const { draftJS, html, markdown, ckEditorMarkup } = document[fieldName] || {}
    return {
      draftJSValue:  editorType === "draftJS"        ? this.initializeDraftJS(draftJS) : null,
      markdownValue: editorType === "markdown"       ? markdown       : null,
      htmlValue:     editorType === "html"           ? html           : null,
      ckEditorValue: editorType === "ckEditorMarkup" ? ckEditorMarkup : null
    }
  }

  getEditorStatesFromLocalStorage = (editorType: string): any => {
    const { document, name } = this.props;
    const savedState = this.getStorageHandlers().get({doc: document, name, prefix:this.getLSKeyPrefix(editorType)})
    if (!savedState) return null;

    if (editorType === "draftJS") {
      try {
        // eslint-disable-next-line no-console
        console.log("Restoring saved document state: ", savedState);
        const contentState = convertFromRaw(savedState)
        if (contentState.hasText()) {
          return {
            draftJSValue: EditorState.createWithContent(contentState)
          };
        } else {
          // eslint-disable-next-line no-console
          console.log("Not restoring empty document state: ", contentState)
        }
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
      return null;
    } else {
      return {
        draftJSValue:  editorType === "draftJS"        ? savedState : null,
        markdownValue: editorType === "markdown"       ? savedState : null,
        htmlValue:     editorType === "html"           ? savedState : null,
        ckEditorValue: editorType === "ckEditorMarkup" ? savedState : null
      }
    }
  }

  restoreFromLocalStorage = () => {
    const savedState = this.getEditorStatesFromLocalStorage(this.getCurrentEditorType());
    if (savedState) {
      this.setState(savedState);
    }
  }
  
  isEmpty = (): boolean => {
    switch(this.getCurrentEditorType()) {
      case "draftJS": {
        const draftJSValue = this.state.draftJSValue;
        if (!draftJSValue) return true;
        const draftJScontent = draftJSValue.getCurrentContent()
        return !draftJScontent.hasText();
      }
      case "markdown": {
        const markdownValue = this.state.markdownValue;
        if (!markdownValue) return true;
        return markdownValue.trim() === "";
      }
      case "html": {
        const htmlValue = this.state.htmlValue;
        if (!htmlValue) return true;
        return htmlValue.trim() === "";
      }
      case "ckEditorMarkup": {
        const ckEditorValue = this.state.ckEditorValue;
        if (!ckEditorValue) return true;
        return ckEditorValue.trim() === "";
      }
      default:
        throw new Error("Invalid editor type");
    }
  }


  getStorageHandlers = () => {
    const { fieldName, form } = this.props
    const collectionName = form.collectionName;
    
    const getLocalStorageId = editableCollectionsFieldOptions[collectionName][fieldName].getLocalStorageId;
    return getLSHandlers(getLocalStorageId)
  }

  initializeDraftJS = (draftJS) => {
    const { document } = this.props

    // Initialize from the database state
    if (draftJS) {
      try {
        return EditorState.createWithContent(convertFromRaw(draftJS));
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error("Invalid document content", document);
      }
    }

    // And lastly, if the field is empty, create an empty draftJS object
    return EditorState.createEmpty();
  }

  submitData = (submission) => {
    const { fieldName } = this.props
    let data: any = null
    const { draftJSValue, markdownValue, htmlValue, updateType, commitMessage, ckEditorReference } = this.state
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
        if (!this.isDocumentCollaborative() && this.context.addToSuccessForm) {
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
    return {
      ...submission,
      [fieldName]: data ? {
        originalContents: {type, data},
        commitMessage, updateType,
      } : null
    }
  }

  resetEditor = () => {
    const { name, document } = this.props;
    // On Form submit, create a new empty editable
    this.setEditorValue("");
    this.getStorageHandlers().reset({doc: document, name, prefix:this.getLSKeyPrefix()})
    this.setState({
      draftJSValue: EditorState.createEmpty(),
      htmlValue: null,
      markdownValue: null,
      editorOverride: null,
      ckEditorValue: null
    });
  }

  componentWillUnmount() {
    if (this.unloadEventListener) {
      window.removeEventListener("beforeunload", this.unloadEventListener);
    }
  }


  setEditorType = (editorType) => {
    if (!editorType) throw new Error("Missing argument to setEditorType: editorType");
    const targetEditorType = editorType;
    this.setState({
      editorOverride: targetEditorType,
      ...this.getEditorStatesFromType(targetEditorType)
    })

    this.restoreFromLocalStorage();
  }

  setDraftJS = (value) => { // Takes in an editorstate
    const { draftJSValue } = this.state
    const currentContent = draftJSValue.getCurrentContent()
    const newContent = value.getCurrentContent()
    this.setState({draftJSValue: value})

    if (currentContent !== newContent) {
      this.afterChange();
    }
  }

  setHtml = (value) => {
    if (this.state.htmlValue !== value) {
      this.setState({htmlValue: value});
      this.afterChange();
    }
  }

  setMarkdown = (value) => {
    if (this.state.markdownValue !== value) {
      this.setState({markdownValue: value})
      this.debouncedCheckMarkdownImgErrs()
      this.afterChange();
    }
  }

  setCkEditor = (editor) => {
    const newContent = editor.getData()
    if (this.state.ckEditorValue !== newContent) {
      this.setState({ckEditorValue: newContent})
      this.afterChange();
    }
  }


  afterChange = () => {
    this.hasUnsavedData = true;
    this.throttledSaveBackup();
  }

  saveBackup = () => {
    const { document, name } = this.props;

    if (this.isEmpty()) {
      this.getStorageHandlers().reset({
        doc: document,
        name,
        prefix: this.getLSKeyPrefix()
      });
      this.hasUnsavedData = false;
    } else {
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
      case "ckEditorMarkup":
        return this.state.ckEditorValue;
    }
  }

  // Get an editor-type-specific prefix to use on localStorage keys, to prevent
  // drafts written with different editors from having conflicting names.
  getLSKeyPrefix = (editorType?: string): string => {
    switch(editorType || this.getCurrentEditorType()) {
      default:
      case "draftJS":  return "";
      case "markdown": return "md_";
      case "html":     return "html_";
      case "ckEditorMarkup": return "ckeditor_";
    }
  }


  renderEditorWarning = () => {
    const { currentUser, classes } = this.props
    const type = this.getInitialEditorType();
    const defaultType = this.getUserDefaultEditor(currentUser)
    return <div>
      <Components.Typography variant="body2" className={classes.lastEditedWarning}>
        This document was last edited in {editorTypeToDisplay[type].name} format. Showing the{' '}
        {editorTypeToDisplay[this.getCurrentEditorType()].name} editor.{' '}
        <a
          className={classes.clickHereColor}
          onClick={() => this.setEditorType(defaultType)}
        >
          Click here
        </a>
        {' '}to switch to the {editorTypeToDisplay[defaultType].name} editor (your default editor).
      </Components.Typography>
      <br/>
    </div>
  }


  getCurrentEditorType = () => {
    // Tags can only be edited via CKEditor
    if (this.props.collectionName === 'Tags') return "ckEditorMarkup"
    
    const { editorOverride } = this.state || {} // Provide default since we can call this function before we initialize state

    // If there is an override, return that
    if (editorOverride)
      return editorOverride;

    return this.getInitialEditorType();
  }

  getInitialEditorType = () => {
    const { document, currentUser, fieldName, value } = this.props

    // Check whether we are directly passed a value in the form context, with a type (as a default value for example)
    if (value?.originalContents?.type) {
      return value.originalContents.type
    }
    // Next check whether the document came with a field value with a type specified
    const originalType = document?.[fieldName]?.originalContents?.type
    if (originalType) return originalType;

    // Finally pick the editor type from the user's config
    return this.getUserDefaultEditor(currentUser)
  }

  getUserDefaultEditor = (user) => {
    if (userUseMarkdownPostEditor(user)) return "markdown"
    if (user?.reenableDraftJs) return "draftJS"
    return "ckEditorMarkup"
  }


  handleUpdateTypeSelect = (e) => {
    this.setState({ updateType: e.target.value })
  }

  renderUpdateTypeSelect = () => {
    const { currentUser, formType, classes, form } = this.props
    if (form.hideControls) return null
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
  
  renderCommitMessageInput = () => {
    const { currentUser, formType, fieldName, form, classes } = this.props
    
    const collectionName = form.collectionName;
    if (!currentUser || (!userCanCreateCommitMessages(currentUser) && collectionName !== "Tags") || formType !== "edit") { return null }
    
    
    const fieldHasCommitMessages = editableCollectionsFieldOptions[collectionName][fieldName].revisionsHaveCommitMessages;
    if (!fieldHasCommitMessages) return null;
    if (form.hideControls) return null
    
    return <div className={classes.changeDescriptionRow}>
      <span className={classes.changeDescriptionLabel}>Edit summary (Briefly describe your changes):{" "}</span>
      <Input
        className={classes.changeDescriptionInput}
        value={this.state.commitMessage}
        onChange={(ev) => {
          this.setState({ commitMessage: ev.target.value });
        }}
      />
    </div>
  }

  renderEditorTypeSelect = () => {
    const { collectionName, currentUser, classes, form } = this.props
    const { LWTooltip } = Components

    if (form.hideControls) return null
    if (!currentUser?.reenableDraftJs && !currentUser?.isAdmin) return null
    const editors = currentUser?.isAdmin ? adminEditors : nonAdminEditors
    
    const tooltip = collectionName === 'Tags' ? `Tags can only be edited in the ${ckEditorName} editor` : "Warning! Changing format will erase your content"
    
    return (
      <LWTooltip title={tooltip} placement="left">
        <Select
          className={classes.select}
          value={this.getCurrentEditorType()}
          onChange={(e) => this.setEditorType(e.target.value)}
          disableUnderline
          disabled={collectionName === 'Tags'}
          >
            {editors.map((editorType, i) =>
              <MenuItem value={editorType} key={i}>
                {editorTypeToDisplay[editorType].name} {editorTypeToDisplay[editorType].postfix}
              </MenuItem>
            )}
          </Select>
      </LWTooltip>
    )
  }

  getBodyStyles = (): {className: string, contentType: "comment"|"answer"|"post"} => {
    const { classes, commentStyles, document } = this.props
    if (commentStyles && document.answer) {
      return {
        className: classes.answerStyles,
        contentType: "answer",
      }
    }
    if (commentStyles) {
      return {
        className: classes.commentBodyStyles,
        contentType: "comment",
      }
    }
    return {
      className: classes.postBodyStyles,
      contentType: "post",
    }
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
    const { classes, formProps, hintText, placeholder  } = this.props
    const {className, contentType} = this.getBodyStyles();

    if (showPlaceholder) {
      return <Components.ContentStyles contentType={contentType} className={classNames(className, classes.placeholder, {[classes.placeholderCollaborationSpacing]: collaboration})}>
        { formProps?.editorHintText || hintText || placeholder }
      </Components.ContentStyles>
    }
  }

  isDocumentCollaborative = () => {
    const { document, fieldName, currentUser } = this.props
    return userHasCkCollaboration(currentUser) && document?._id && document?.shareWithUsers && (fieldName === "contents")
  }

  renderCkEditor = () => {
    const { ckEditorValue, ckEditorReference } = this.state
    const { document, currentUser, formType, classes } = this.props
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

      return <div className={classNames(this.getHeightClass(), this.getMaxHeightClass(), classes.ckEditorStyles)}>
          { this.renderPlaceholder(!value, collaboration)}
          { collaboration ?
            <CKEditor key="ck-collaborate" { ...editorProps } collaboration />
            :
            <CKEditor key="ck-default" { ...editorProps } />}
        </div>
    }
  }

  checkMarkdownImgErrs = () => {
    const { markdownValue } = this.state
    // match markdown image tags of the form
    // ![](http://example.com/example.jpg)
    // ![Alt text](http://example.com/example.jpg)
    const httpImageRE = /!\[[^\]]*?\]\(http:/g
    this.setState({
      markdownImgErrs: httpImageRE.test(markdownValue)
    })
  }

  renderPlaintextEditor = (editorType) => {
    const { markdownValue, htmlValue, markdownImgErrs } = this.state
    const { classes, document, form: { commentStyles } } = this.props
    const value = (editorType === "html" ? htmlValue : markdownValue) || ""
    const {className, contentType} = this.getBodyStyles();
    
    return <div>
      { this.renderPlaceholder(!value, false) }
      <Components.ContentStyles contentType={contentType}>
        <Input
          className={classNames(classes.markdownEditor, className, {[classes.questionWidth]: document.question})}
          value={value}
          onChange={(ev) => {
            if (editorType === "html")
              this.setHtml(ev.target.value);
            else
              this.setMarkdown(ev.target.value);
          }}
          multiline={true}
          rows={commentStyles ? commentEditorHeightRows : postEditorHeightRows}
          rowsMax={99999}
          fullWidth={true}
          disableUnderline={true}
        />
      </Components.ContentStyles>
      {markdownImgErrs && editorType === 'markdown' && <Components.Typography component='aside' variant='body2' className={classes.markdownImgErrText}>
        Your Markdown contains at least one link to an image served over an insecure HTTP{' '}
        connection. You should update all links to images so that they are served over a{' '}
        secure HTTPS connection (i.e. the links should start with <em>https://</em>).
      </Components.Typography>}
    </div>
  }

  renderDraftJSEditor = () => {
    const { draftJSValue } = this.state
    const { document, form, classes } = this.props
    const showPlaceholder = !(draftJSValue?.getCurrentContent && draftJSValue.getCurrentContent().hasText())
    const {className, contentType} = this.getBodyStyles();

    return <div>
      { this.renderPlaceholder(showPlaceholder, false) }
      {draftJSValue && <Components.ContentStyles contentType={contentType}>
        <Components.DraftJSEditor
          editorState={draftJSValue}
          onChange={this.setDraftJS}
          commentEditor={form?.commentEditor}
          className={classNames(className, this.getHeightClass(), this.getMaxHeightClass(), {[classes.questionWidth]: document.question})}
        />
      </Components.ContentStyles>}
    </div>
  }

  getMaxHeightClass = () => {
    const { classes, formProps } = this.props
    return formProps?.maxHeight ? classes.maxHeight : null
  }

  getHeightClass = () => {
    const { document, classes, form: { commentStyles } } = this.props
    if (commentStyles) {
      return classes.commentEditorHeight
    } else if (document.question) {
      return classes.questionEditorHeight;
    } else {
      return classes.postEditorHeight
    }
  }


  render() {
    const { editorOverride, loading } = this.state
    const { document, currentUser, formType, classes, collectionName, label } = this.props
    const { Loading, ContentStyles } = Components
    const currentEditorType = this.getCurrentEditorType()
    const {className, contentType} = this.getBodyStyles();

    if (!document) return null;

    const editorWarning =
      !editorOverride
      && formType !== "new"
      && collectionName !== 'Tags'
      && this.getInitialEditorType() !== this.getUserDefaultEditor(currentUser)
      && this.renderEditorWarning()
    return <div>
      { label && <FormLabel className={classes.label}>{label}</FormLabel>}
      { editorWarning }
      <ContentStyles contentType={contentType} className={classNames(classes.editor, className)}>
        { loading ? <Loading/> : this.renderEditorComponent(currentEditorType) }
        { this.renderUpdateTypeSelect() }
        { this.renderEditorTypeSelect() }
      </ContentStyles>
      { this.renderCommitMessageInput() }
    </div>
  }
};

(EditorFormComponent as any).contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

export const EditorFormComponentComponent = registerComponent(
  'EditorFormComponent', EditorFormComponent, {
    styles,
    hocs: [withUser, withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    EditorFormComponent: typeof EditorFormComponentComponent
  }
}
