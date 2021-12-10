import React, { Component, MutableRefObject } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { userUseMarkdownPostEditor } from '../../lib/collections/users/helpers';
import { editorStyles, postBodyStyles, answerStyles, commentBodyStyles } from '../../themes/stylePiping'
import withUser from '../common/withUser';
import classNames from 'classnames';
import Input from '@material-ui/core/Input';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import EditorForm from '../async/EditorForm'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import * as _ from 'underscore';
import { isClient } from '../../lib/executionEnvironment';
import { forumTypeSetting } from '../../lib/instanceSettings';

const postEditorHeight = 250;
const questionEditorHeight = 150;
const commentEditorHeight = 100;
const postEditorHeightRows = 15;
const commentEditorHeightRows = 5;

export const styles = (theme: ThemeType): JssStyles => ({
  editor: {
    position: 'relative',
  },
  postBodyStyles: {
    ...editorStyles(theme, postBodyStyles),
    cursor: "text",
    padding: 0,
    '& li .public-DraftStyleDefault-block': {
      margin: 0
    }
  },

  answerStyles: {
    ...editorStyles(theme, answerStyles),
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
    color: "rgba(0,0,0,.87)",
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

export const getUserDefaultEditor = (user: UsersCurrent|null) => {
  if (userUseMarkdownPostEditor(user)) return "markdown"
  if (user?.reenableDraftJs) return "draftJS"
  return "ckEditorMarkup"
}

interface EditorProps {
  ref?: MutableRefObject<Editor|null>,
  currentUser: UsersCurrent|null,
  formType: "edit"|"new",
  documentId?: string,
  initialEditorType: string,
  initialFieldValue: any,
  isCollaborative: boolean,
  value: any,
  placeholder?: string,
  commentStyles?: boolean,
  answerStyles?: boolean,
  questionStyles?: boolean,
  commentEditor?: boolean,
  hideControls?: boolean,
  maxHeight?: boolean|null,
  hasCommitMessages?: boolean,
  getLocalStorageHandlers: (editorType?: string) => any,
  _classes: ClassesType,
}

interface EditorComponentState {
  editorOverride: any,
  updateType: string,
  commitMessage: string,
  ckEditorReference: any,
  loading: boolean,
  draftJSValue: any,
  ckEditorValue: any,
  markdownValue: any,
  htmlValue: any,
  markdownImgErrs: boolean
}

export class Editor extends Component<EditorProps,EditorComponentState> {
  hasUnsavedData: boolean
  throttledSaveBackup: any
  throttledSetCkEditor: any
  debouncedCheckMarkdownImgErrs: any
  unloadEventListener: any

  constructor(props: EditorProps) {
    super(props)
    
    const editorType = this.getCurrentEditorType()
    this.state = {
      editorOverride: null,
      updateType: 'minor',
      commitMessage: "",
      ckEditorReference: null,
      loading: true,
      ...this.getEditorStatesFromType(editorType),
      markdownImgErrs: false
    }
    this.hasUnsavedData = false;
    this.throttledSaveBackup = _.throttle(this.saveBackup, autosaveInterval, {leading:false});
    this.throttledSetCkEditor = _.throttle(this.setCkEditor, autosaveInterval);
    this.debouncedCheckMarkdownImgErrs = _.debounce(this.checkMarkdownImgErrs, checkImgErrsInterval);

  }

  async componentDidMount() {
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

    if (isClient) {
      this.restoreFromLocalStorage();
      this.setState({loading: false})
    }
  }

  getEditorStatesFromType = (editorType: string, contents?: any) => {
    const { value, initialFieldValue } = this.props
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
    const { draftJS, html, markdown, ckEditorMarkup } = initialFieldValue;
    return {
      draftJSValue:  editorType === "draftJS"        ? this.initializeDraftJS(draftJS) : null,
      markdownValue: editorType === "markdown"       ? markdown       : null,
      htmlValue:     editorType === "html"           ? html           : null,
      ckEditorValue: editorType === "ckEditorMarkup" ? ckEditorMarkup : null
    }
  }

  getEditorStatesFromLocalStorage = (editorType: string): any => {
    const savedState = this.getLocalStorageHandlers(editorType).get();
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


  getLocalStorageHandlers = (editorType?: string) => {
    return this.props.getLocalStorageHandlers(editorType || this.getCurrentEditorType());
  }
  
  initializeDraftJS = (draftJS) => {
    // Initialize from the database state
    if (draftJS) {
      try {
        return EditorState.createWithContent(convertFromRaw(draftJS));
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error("Invalid document content", draftJS);
      }
    }

    // And lastly, if the field is empty, create an empty draftJS object
    return EditorState.createEmpty();
  }

  submitData = (submission) => {
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
        data = ckEditorReference.getData()
        break
      default:
        // eslint-disable-next-line no-console
        console.error(`Unrecognized editor type: ${type}`);
        data = "";
        break;
    }
    return data ? {
      originalContents: {type, data},
      commitMessage, updateType,
    } : undefined
  }

  resetEditor = () => {
    // On Form submit, create a new empty editable
    this.getLocalStorageHandlers().reset();
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
    if (this.isEmpty()) {
      this.getLocalStorageHandlers().reset();
      this.hasUnsavedData = false;
    } else {
      const serialized = this.editorContentsToJson();
      const success = this.getLocalStorageHandlers().set(serialized);
  
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
  

  renderEditorWarning = () => {
    const { currentUser, initialEditorType, _classes: classes } = this.props
    const type = initialEditorType;
    const defaultType = getUserDefaultEditor(currentUser)
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
    const { editorOverride } = this.state || {} // Provide default since we can call this function before we initialize state

    // If there is an override, return that
    if (editorOverride)
      return editorOverride;

    return this.props.initialEditorType;
  }


  handleUpdateTypeSelect = (e) => {
    this.setState({ updateType: e.target.value })
  }

  renderUpdateTypeSelect = () => {
    const { currentUser, formType, _classes: classes, hideControls } = this.props
    if (hideControls) return null
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
    const { hideControls, hasCommitMessages, _classes: classes } = this.props
    
    if (!hasCommitMessages) return null;
    if (hideControls) return null
    
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
    const { currentUser, _classes: classes, hideControls } = this.props
    const { LWTooltip } = Components

    if (hideControls) return null
    if (!currentUser?.reenableDraftJs && !currentUser?.isAdmin) return null
    const editors = currentUser?.isAdmin ? adminEditors : nonAdminEditors
    return (
      <LWTooltip title="Warning! Changing format will erase your content" placement="left">
        <Select
          className={classes.select}
          value={this.getCurrentEditorType()}
          onChange={(e) => this.setEditorType(e.target.value)}
          disableUnderline
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

  getBodyStyles = () => {
    const { _classes: classes, commentStyles, answerStyles } = this.props
    if (commentStyles && answerStyles) return classes.answerStyles
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
    const { _classes: classes, placeholder } = this.props

    if (showPlaceholder) {
      return <div className={classNames(this.getBodyStyles(), classes.placeholder, {[classes.placeholderCollaborationSpacing]: collaboration})}>
        { placeholder }
      </div>
    }
  }

  isDocumentCollaborative = () => {
    return this.props.isCollaborative;
  }

  renderCkEditor = () => {
    const { ckEditorValue, ckEditorReference } = this.state
    const { documentId, currentUser, commentEditor, formType } = this.props
    const { Loading } = Components
    const CKEditor = commentEditor ? Components.CKCommentEditor : Components.CKPostEditor;
    const value = ckEditorValue || ckEditorReference?.getData()
    if (!CKEditor) {
      return <Loading />
    } else {
      const editorProps = {
        data: value,
        documentId: documentId,
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

      return <div className={classNames(this.getHeightClass(), this.getMaxHeightClass())}>
          { this.renderPlaceholder(!value, collaboration)}
          { collaboration ?
            <Components.CKPostEditor key="ck-collaborate" { ...editorProps } collaboration />
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
    const { _classes: classes, commentStyles, questionStyles } = this.props
    const value = (editorType === "html" ? htmlValue : markdownValue) || ""
    return <div>
        { this.renderPlaceholder(!value, false) }
        <Input
          className={classNames(classes.markdownEditor, this.getBodyStyles(), {[classes.questionWidth]: questionStyles})}
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
      {markdownImgErrs && editorType === 'markdown' && <Components.Typography component='aside' variant='body2' className={classes.markdownImgErrText}>
          Your Markdown contains at least one link to an image served over an insecure HTTP{' '}
          connection. You should update all links to images so that they are served over a{' '}
          secure HTTPS connection (i.e. the links should start with <em>https://</em>).
        </Components.Typography>}
      </div>
  }

  renderDraftJSEditor = () => {
    const { draftJSValue } = this.state
    const { questionStyles, commentEditor, _classes: classes } = this.props
    const showPlaceholder = !(draftJSValue?.getCurrentContent && draftJSValue.getCurrentContent().hasText())

    return <div>
        { this.renderPlaceholder(showPlaceholder, false) }
        {draftJSValue && <EditorForm
          editorState={draftJSValue}
          onChange={this.setDraftJS}
          commentEditor={commentEditor||false}
          className={classNames(this.getBodyStyles(), this.getHeightClass(), this.getMaxHeightClass(), {[classes.questionWidth]: questionStyles})}
        />}
      </div>
  }

  getMaxHeightClass = () => {
    const { _classes: classes, maxHeight } = this.props
    return maxHeight ? classes.maxHeight : null
  }

  getHeightClass = () => {
    const { _classes: classes, commentStyles, questionStyles } = this.props
    if (commentStyles) {
      return classes.commentEditorHeight
    } else if (questionStyles) {
      return classes.questionEditorHeight;
    } else {
      return classes.postEditorHeight
    }
  }


  render() {
    const { editorOverride, loading } = this.state
    const { currentUser, initialEditorType, formType, _classes: classes } = this.props
    const { Loading } = Components
    const currentEditorType = this.getCurrentEditorType()

    const editorWarning =
      !editorOverride
      && formType !== "new"
      && initialEditorType !== getUserDefaultEditor(currentUser)
      && this.renderEditorWarning()
    return <div>
      { editorWarning }
      <div className={classNames(classes.editor, this.getBodyStyles())}>
        { loading ? <Loading/> : this.renderEditorComponent(currentEditorType) }
        { this.renderUpdateTypeSelect() }
        { this.renderEditorTypeSelect() }
      </div>
      { this.renderCommitMessageInput() }
    </div>
  }
};

// HACK: This component needs to be able have a ref so that the parent component
// can call its methods, which means it can't have any HoCs. In particular, it
// can't have 'styles' (since that would add a HoC); instead, it exports its
// styles, and has classes provided by whatever wraps it.
export const EditorComponent = registerComponent('Editor', Editor);

declare global {
  interface ComponentTypes {
    Editor: typeof EditorComponent
  }
}
