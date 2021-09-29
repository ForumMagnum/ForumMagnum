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

type EditorTypeString = "html"|"markdown"|"draftJS"|"ckEditorMarkup";

const editorTypeToDisplay: Record<EditorTypeString,{name: string, postfix?:string}> = {
  html: {name: 'HTML', postfix: '[Admin Only]'},
  ckEditorMarkup: {name: ckEditorName, postfix: '[Beta]'},
  markdown: {name: 'Markdown'},
  draftJS: {name: 'Draft-JS'},
}

const nonAdminEditors: EditorTypeString[] = ['ckEditorMarkup', 'markdown', 'draftJS']
const adminEditors: EditorTypeString[] = ['html', 'ckEditorMarkup', 'markdown', 'draftJS']

export const getUserDefaultEditor = (user: UsersCurrent|null): EditorTypeString => {
  if (userUseMarkdownPostEditor(user)) return "markdown"
  if (user?.reenableDraftJs) return "draftJS"
  return "ckEditorMarkup"
}

export interface EditorContents {
  type: EditorTypeString,
  value: any,
}

interface EditorProps {
  ref?: MutableRefObject<Editor|null>,
  currentUser: UsersCurrent|null,
  formType: "edit"|"new",
  documentId?: string,
  initialEditorType: EditorTypeString,
  isCollaborative: boolean,
  value: EditorContents,
  setValue: (value: EditorContents)=>void,
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
  updateType: string,
  commitMessage: string,
  ckEditorReference: any,
  loading: boolean,
  markdownImgErrs: boolean
}

export const getBlankEditorContents = (editorType: EditorTypeString): EditorContents => {
  if (editorType === "draftJS") {
    return {
      type: editorType,
      value: EditorState.createEmpty(),
    }
  } else {
    return {
      type: editorType,
      value: "",
    }
  }
}

const isBlank = (editorContents: EditorContents): boolean => {
  if (!editorContents.value)
    return true;
  
  if (editorContents.type === "draftJS") {
    const draftJScontent = editorContents.value.getCurrentContent()
    return !draftJScontent.hasText();
  } else {
    return editorContents.value.trim() === "";
  }
}

export const getInitialEditorContents = (value, document, fieldName, currentUser: UsersCurrent|null): EditorContents => {
  const initialEditorType = (
    value?.originalContents?.type
    || document?.[fieldName]?.originalContents?.type
    || getUserDefaultEditor(currentUser)
  );
  const initialValue = value?.originalContents || document?.[fieldName]?.originalContents;
  if (!initialValue)
    return getBlankEditorContents(initialEditorType);
  
  if (initialEditorType === "draftJS") {
    return {
      type: "draftJS",
      value: EditorState.createWithContent(convertFromRaw(initialValue.data)),
    };
  } else {
    return {
      type: initialEditorType,
      value: initialValue.data,
    };
  }
}

export const getContentsFromLocalStorage = (editorType: string): EditorContents|null => {
  return null;
  // TODO
  /*
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
  */
}

const convertEditorType = (value: EditorContents, type: EditorTypeString): EditorContents => {
  // TODO
  return getBlankEditorContents(type);
}

const editorContentsToJSON = (contents: EditorContents): any => {
  if (contents.type === "draftJS") {
    return {
      type: "draftJS",
      value: convertToRaw(contents.value.getCurrentContent()),
    };
  } else {
    return contents;
  }
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
      updateType: 'minor',
      commitMessage: "",
      ckEditorReference: null,
      loading: true,
      markdownImgErrs: false
    }
    
    this.hasUnsavedData = false;
    this.throttledSaveBackup = _.throttle(this.saveBackup, autosaveInterval, {leading:false});
    this.throttledSetCkEditor = _.throttle((value) => this.setContents("ckEditorMarkup", value), autosaveInterval);
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

  restoreFromLocalStorage = () => {
    const savedContents = getContentsFromLocalStorage(this.getCurrentEditorType());
    if (savedContents) {
      this.props.setValue(savedContents);
    }
  }
  
  getLocalStorageHandlers = (editorType?: string) => {
    return this.props.getLocalStorageHandlers(editorType || this.getCurrentEditorType());
  }

  submitData = (submission) => {
    let data: any = null
    const { updateType, commitMessage, ckEditorReference } = this.state
    const type = this.getCurrentEditorType()
    switch(this.props.value.type) {
      case "draftJS":
        const draftJS = this.props.value.value.getCurrentContent()
        data = draftJS.hasText() ? convertToRaw(draftJS) : null
        break
      case "markdown":
      case "html":
        data = this.props.value.value;
        break
      case "ckEditorMarkup":
        if (!ckEditorReference) throw Error("Can't submit ckEditorMarkup without attached CK Editor")
        data = ckEditorReference.getData()
        break
    }
    return data ? {
      originalContents: {type, data},
      commitMessage, updateType,
    } : undefined
  }

  resetEditor = () => {
    // On Form submit, create a new empty editable
    this.getLocalStorageHandlers().reset();
  }

  componentWillUnmount() {
    if (this.unloadEventListener) {
      window.removeEventListener("beforeunload", this.unloadEventListener);
    }
  }


  setEditorType = (editorType: EditorTypeString) => {
    if (!editorType)
      throw new Error("Missing argument to setEditorType: editorType");
    this.props.setValue(convertEditorType(this.props.value, editorType));
  }
  
  setContents = (editorType: EditorTypeString, value) => {
    switch (editorType) {
      case "html": {
        if (this.props.value.value === value)
          return;
        this.props.setValue({type: editorType, value});
        break;
      }
      case "markdown": {
        if (this.props.value.value === value)
          return;
        this.props.setValue({type: editorType, value});
        this.debouncedCheckMarkdownImgErrs()
        break;
      }
      case "draftJS": {
        this.props.setValue({type: "draftJS", value});
        break;
      }
      case "ckEditorMarkup": {
        this.props.setValue({type: "ckEditorMarkup", value})
        break;
      }
    }
    
    this.hasUnsavedData = true;
    this.throttledSaveBackup();
  }

  saveBackup = () => {
    if (isBlank(this.props.value)) {
      this.getLocalStorageHandlers().reset();
      this.hasUnsavedData = false;
    } else {
      const serialized = editorContentsToJSON(this.props.value);
      const success = this.getLocalStorageHandlers().set(serialized);
  
      if (success) {
        this.hasUnsavedData = false;
      }
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


  getCurrentEditorType = (): EditorTypeString => {
    return this.props.value.type;
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
          onChange={(e) => this.setEditorType(e.target.value as EditorTypeString)}
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

  renderEditorComponent = (contents: EditorContents) => {
    switch (contents.type) {
      case "ckEditorMarkup":
        return this.renderCkEditor(contents)
      case "draftJS":
        return this.renderDraftJSEditor(contents)
      case "markdown":
        return this.renderPlaintextEditor(contents)
      case "html":
        return this.renderPlaintextEditor(contents)
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

  renderCkEditor = (contents: EditorContents) => {
    const { ckEditorReference } = this.state
    const ckEditorValue = contents.value;
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
        onChange: (event, editor) => this.throttledSetCkEditor(editor.getData()),
        onInit: editor => this.setState({ckEditorReference: editor})
      }

      // if document is shared with at least one user, it will render the collaborative ckEditor (note: this costs a small amount of money per document)
      //
      // requires _id because before the draft is saved, ckEditor loses track of what you were writing when turning collaborate on and off (and, meanwhile, you can't actually link people to a shared draft before it's saved anyhow)
      // TODO: figure out a better solution to this problem.

      const collaboration = this.isDocumentCollaborative()

      return <div className={classNames(this.getHeightClass(), this.getMaxHeightClass())}>
        { this.renderPlaceholder(!value, collaboration)}
        { collaboration
          ? <Components.CKPostEditor key="ck-collaborate" { ...editorProps } collaboration />
          : <CKEditor key="ck-default" { ...editorProps } />}
      </div>
    }
  }

  checkMarkdownImgErrs = () => {
    if (this.props.value.type === "markdown") {
      const markdownValue = this.props.value.value;
      // match markdown image tags of the form
      // ![](http://example.com/example.jpg)
      // ![Alt text](http://example.com/example.jpg)
      const httpImageRE = /!\[[^\]]*?\]\(http:/g
      this.setState({
        markdownImgErrs: httpImageRE.test(markdownValue)
      })
    }
  }

  renderPlaintextEditor = (contents: EditorContents) => {
    const { markdownImgErrs } = this.state
    const { _classes: classes, commentStyles, questionStyles } = this.props
    const value = contents.value || "";
    return <div>
      { this.renderPlaceholder(!value, false) }
      <Input
        className={classNames(classes.markdownEditor, this.getBodyStyles(), {[classes.questionWidth]: questionStyles})}
        value={value}
        onChange={(ev) => {
          this.setContents(contents.type, ev.target.value);
        }}
        multiline={true}
        rows={commentStyles ? commentEditorHeightRows : postEditorHeightRows}
        rowsMax={99999}
        fullWidth={true}
        disableUnderline={true}
      />
    {markdownImgErrs && contents.type === 'markdown' && <Components.Typography component='aside' variant='body2' className={classes.markdownImgErrText}>
        Your Markdown contains at least one link to an image served over an insecure HTTP{' '}
        connection. You should update all links to images so that they are served over a{' '}
        secure HTTPS connection (i.e. the links should start with <em>https://</em>).
      </Components.Typography>}
    </div>
  }

  renderDraftJSEditor = (contents: EditorContents) => {
    const draftJSValue = contents.value;
    const { questionStyles, commentEditor, _classes: classes } = this.props
    const showPlaceholder = !(draftJSValue?.getCurrentContent && draftJSValue.getCurrentContent().hasText())

    return <div>
      { this.renderPlaceholder(showPlaceholder, false) }
      {draftJSValue && <EditorForm
        editorState={draftJSValue}
        onChange={(value) => this.setContents("draftJS", value)}
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
    const { loading } = this.state
    const { currentUser, initialEditorType, formType, _classes: classes } = this.props
    const { Loading } = Components
    const currentEditorType = this.getCurrentEditorType()

    const editorWarning =
      formType !== "new"
      && initialEditorType !== getUserDefaultEditor(currentUser)
      && this.renderEditorWarning()
    return <div>
      { editorWarning }
      <div className={classNames(classes.editor, this.getBodyStyles())}>
        { loading ? <Loading/> : this.renderEditorComponent(this.props.value) }
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
