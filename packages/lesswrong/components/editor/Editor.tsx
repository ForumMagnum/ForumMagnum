import React, { Component, MutableRefObject } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { userUseMarkdownPostEditor } from '../../lib/collections/users/helpers';
import { editorStyles, postBodyStyles, answerStyles, commentBodyStyles } from '../../themes/stylePiping'
import withUser from '../common/withUser';
import classNames from 'classnames';
import Input from '@material-ui/core/Input';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import DraftJSEditor from './DraftJSEditor';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { editableCollectionsFieldOptions } from '../../lib/editor/make_editable';
import * as _ from 'underscore';
import { isClient } from '../../lib/executionEnvironment';
import { forumTypeSetting } from '../../lib/instanceSettings';
import type { CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';

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
})

const autosaveInterval = 3000; //milliseconds
const checkImgErrsInterval = 500; //milliseconds
const ckEditorName = forumTypeSetting.get() === 'EAForum' ? 'EA Forum Docs' : 'LessWrong Docs'

export type EditorTypeString = "html"|"markdown"|"draftJS"|"ckEditorMarkup";

export const editorTypeToDisplay: Record<EditorTypeString,{name: string, postfix?:string}> = {
  html: {name: 'HTML', postfix: '[Admin Only]'},
  ckEditorMarkup: {name: ckEditorName, postfix: '[Beta]'},
  markdown: {name: 'Markdown'},
  draftJS: {name: 'Draft-JS'},
}

export const nonAdminEditors: EditorTypeString[] = ['ckEditorMarkup', 'markdown', 'draftJS']
export const adminEditors: EditorTypeString[] = ['html', 'ckEditorMarkup', 'markdown', 'draftJS']

export const getUserDefaultEditor = (user: UsersCurrent|null): EditorTypeString => {
  if (userUseMarkdownPostEditor(user)) return "markdown"
  if (user?.reenableDraftJs) return "draftJS"
  return "ckEditorMarkup"
}

// Contents of an editor, with `value` in the native format of the editor
// (whichever editor that is). For DraftJS in particular, this means `value` is
// a DraftJS EditorState object.
export interface EditorContents {
  type: EditorTypeString,
  value: any,
}

export interface EditorChangeEvent {
  contents: EditorContents,
  autosave: boolean,
}


// Contents of an editor, with `value` in a JSON-serializable format.
export interface SerializedEditorContents {
  type: EditorTypeString,
  value: any,
}

interface EditorProps {
  ref?: MutableRefObject<Editor|null>,
  currentUser: UsersCurrent|null,
  formType: "edit"|"new",
  documentId?: string,
  collectionName: CollectionNameString,
  fieldName: string,
  initialEditorType: EditorTypeString,
  
  // Whether to use the CkEditor collaborative editor, ie, this is the
  // contents field of a shared post.
  isCollaborative: boolean,
  
  // If isCollaborative is set, the access level the user should have
  // with CkEditor. Otherwise ignored.
  accessLevel?: CollaborativeEditingAccessLevel,
  
  value: EditorContents,
  onChange: (change: EditorChangeEvent)=>void,
  placeholder?: string,
  commentStyles?: boolean,
  answerStyles?: boolean,
  questionStyles?: boolean,
  commentEditor?: boolean,
  hideControls?: boolean,
  maxHeight?: boolean|null,
  hasCommitMessages?: boolean,
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

export const isBlank = (editorContents: EditorContents): boolean => {
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
  const initialValue = value?.originalContents || document?.[fieldName]?.originalContents;
  if (initialValue) {
    const result = deserializeEditorContents({
      type: initialValue.type,
      value: initialValue.data,
    });
    if (result) {
      return result;
    }
  }
  
  return getBlankEditorContents(getUserDefaultEditor(currentUser));
}

export const serializeEditorContents = (contents: EditorContents): SerializedEditorContents => {
  if (contents.type === "draftJS") {
    return {
      type: "draftJS",
      value: convertToRaw(contents.value.getCurrentContent()),
    };
  } else {
    return contents;
  }
}

export const deserializeEditorContents = (contents: SerializedEditorContents): EditorContents|null => {
  if (!contents?.type) {
    return null;
  } else if (contents.type === "draftJS") {
    return {
      type: "draftJS",
      value: EditorState.createWithContent(convertFromRaw(contents.value)),
    };
  } else {
    return contents;
  }
}

export class Editor extends Component<EditorProps,EditorComponentState> {
  throttledSetCkEditor: any
  debouncedCheckMarkdownImgErrs: any

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
    
    this.throttledSetCkEditor = _.throttle((value) => this.setContents("ckEditorMarkup", value), autosaveInterval);
    this.debouncedCheckMarkdownImgErrs = _.debounce(this.checkMarkdownImgErrs, checkImgErrsInterval);
  }

  async componentDidMount() {
    if (isClient) {
      this.setState({loading: false})
    }
  }

  submitData = (submission) => {
    let data: any = null
    const { updateType, commitMessage, ckEditorReference } = this.state
    const type = this.getCurrentEditorType()
    switch(this.props.value.type) {
      case "draftJS":
        const draftJS = this.props.value.value.getCurrentContent()
        data = convertToRaw(draftJS);
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
    return {
      originalContents: {type, data},
      commitMessage, updateType,
    };
  }
  
  setContents = (editorType: EditorTypeString, value) => {
    switch (editorType) {
      case "html": {
        if (this.props.value.value === value)
          return;
        this.props.onChange({
          contents: {type: editorType, value},
          autosave: true,
        });
        break;
      }
      case "markdown": {
        if (this.props.value.value === value)
          return;
        this.props.onChange({
          contents: {type: editorType, value},
          autosave: true,
        });
        this.debouncedCheckMarkdownImgErrs()
        break;
      }
      case "draftJS": {
        this.props.onChange({
          contents: {type: editorType, value},
          autosave: true,
        });
        break;
      }
      case "ckEditorMarkup": {
        this.props.onChange({
          contents: {type: editorType, value},
          autosave: true,
        })
        break;
      }
    }
  }


  getCurrentEditorType = (): EditorTypeString => {
    return this.props.value.type;
  }


  renderUpdateTypeSelect = () => {
    const { currentUser, formType, _classes: classes, hideControls } = this.props
    if (hideControls) return null
    if (!currentUser || !currentUser.isAdmin || formType !== "edit") { return null }
    return <Select
      value={this.state.updateType}
      onChange={(e) => {
        this.setState({ updateType: e.target.value })
      }}
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

  renderPlaceholder = (showPlaceholder, isCollaborative) => {
    const { _classes: classes, placeholder } = this.props

    if (showPlaceholder) {
      return <div className={classNames(this.getBodyStyles(), classes.placeholder, {[classes.placeholderCollaborationSpacing]: isCollaborative})}>
        { placeholder }
      </div>
    }
  }
  
  renderCkEditor = (contents: EditorContents) => {
    const { ckEditorReference } = this.state
    const value = (typeof contents?.value === 'string') ? contents.value : ckEditorReference?.getData();
    const { documentId, collectionName, fieldName, currentUser, commentEditor, formType, isCollaborative } = this.props
    const { Loading } = Components
    const CKEditor = commentEditor ? Components.CKCommentEditor : Components.CKPostEditor;
    if (!CKEditor) {
      return <Loading />
    } else {
      const editorProps = {
        data: value,
        documentId: documentId,
        collectionName, fieldName,
        formType: formType,
        userId: currentUser?._id,
        onChange: (event, editor) => {
          const data: string = editor.getData();
          // If transitioning from empty to nonempty or nonempty to empty,
          // bypass throttling. These cases don't have the performance
          // implications that motivated having throttling in the first place,
          // and this prevents an annoying delay in the blank-document
          // placeholder text appearing/disappeaering.
          if (isBlank({type: "ckEditorMarkup", value: data}) || isBlank(this.props.value)) {
            this.throttledSetCkEditor.cancel();
            this.setContents("ckEditorMarkup", data);
          } else {
            this.throttledSetCkEditor(data)
          }
        },
        onInit: editor => this.setState({ckEditorReference: editor})
      }

      // if document is shared with at least one user, it will render the collaborative ckEditor (note: this costs a small amount of money per document)
      //
      // requires _id because before the draft is saved, ckEditor loses track of what you were writing when turning collaborate on and off (and, meanwhile, you can't actually link people to a shared draft before it's saved anyhow)
      // TODO: figure out a better solution to this problem.

      const showPlaceholder = isBlank({type: "ckEditorMarkup", value});

      return <div className={this.getHeightClass()}>
        { this.renderPlaceholder(showPlaceholder, isCollaborative)}
        { isCollaborative
          ? <Components.CKPostEditor key="ck-collaborate"
              {...editorProps}
              isCollaborative={true}
              accessLevel={this.props.accessLevel}
            />
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
      {draftJSValue && <DraftJSEditor
        editorState={draftJSValue}
        onChange={(value) => this.setContents("draftJS", value)}
        commentEditor={commentEditor||false}
        className={classNames(
          this.getBodyStyles(),
          this.getHeightClass(),
          {[classes.questionWidth]: questionStyles}
        )}
      />}
    </div>
  }
  

  getBodyStyles = () => {
    const { _classes: classes, commentStyles, answerStyles } = this.props
    if (commentStyles && answerStyles) return classes.answerStyles
    if (commentStyles) return classes.commentBodyStyles
    return classes.postBodyStyles
  }

  getHeightClass = () => {
    const { _classes: classes, commentStyles, questionStyles, maxHeight } = this.props
    
    return classNames({
      [classes.commentEditorHeight]: commentStyles,
      [classes.questionEditorHeight]: questionStyles && !commentStyles,
      [classes.postEditorHeight]: !commentStyles && !questionStyles,
      [classes.maxHeight]: maxHeight,
    });
  }

  focusOnEditor = () => {
    // TODO
  }

  render() {
    const { loading } = this.state
    const { currentUser, initialEditorType, formType, _classes: classes } = this.props
    const { Loading } = Components
    const currentEditorType = this.getCurrentEditorType()

    return <div>
      <div className={classNames(classes.editor, this.getBodyStyles())}>
        { loading ? <Loading/> : this.renderEditorComponent(this.props.value) }
        { this.renderUpdateTypeSelect() }
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
