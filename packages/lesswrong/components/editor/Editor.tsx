import React, { Component, MutableRefObject } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userUseMarkdownPostEditor } from '../../lib/collections/users/helpers';
import { editorStyles, ckEditorStyles } from '../../themes/stylePiping'
import classNames from 'classnames';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import { debounce } from 'underscore';
import { isClient } from '../../lib/executionEnvironment';
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import type { CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { styles as greyEditorStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import FormLabel from '@/lib/vendor/@material-ui/core/src/FormLabel';
import {checkEditorValid} from './validation'
import ContentStyles from "../common/ContentStyles";
import CKCommentEditor from "./CKCommentEditor";
import CKPostEditor from "./CKPostEditor";
import WarningBanner from "../common/WarningBanner";
import { Typography } from "../common/Typography";
import { MenuItem } from "../common/Menus";
import Loading from "../vulcan-core/Loading";
import SectionTitle from "../common/SectionTitle";

const postEditorHeight = isEAForum ? 250 : 400;
const questionEditorHeight = isEAForum ? 150 : 400;
const commentEditorHeight = 100;
const quickTakesEditorHeight = 100;
const commentMinimalistEditorHeight = 28;
const postEditorHeightRows = 15;
const commentEditorHeightRows = 5;
const quickTakesEditorHeightRows = 5;

export const styles = (theme: ThemeType) => ({
  root: {
    position: 'relative'
  },
  editor: {
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
  },
  markdownEditor: {
    fontSize: "inherit",
    fontFamily: "inherit",
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
  commentBodyStylesMinimalist: {
    ...editorStyles(theme),
    cursor: "text",
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
    pointerEvents: 'auto',
    '& textarea': {
      marginTop: 0,
      maxHeight: commentMinimalistEditorHeight,
      '&:focus': {
        maxHeight: '128px',
      }
    },
    lineHeight: '1em',
  },
  
  ckEditorStyles: {
    ...ckEditorStyles(theme),
  },
  ckEditorGrey: {
    ...greyEditorStyles(theme).root,
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
  quickTakesEditorHeight: {
    minHeight: quickTakesEditorHeight,
    '& .ck.ck-content': {
      minHeight: quickTakesEditorHeight,
    }
  },
  commentMinimalistEditorHeight: {
    '& .ck-editor__editable': {
      maxHeight: "300px"
    },
    '& .ck.ck-editor__editable_inline>:last-child': {
      marginBottom: 0
    },
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
    whiteSpace: "pre-wrap",
    // Without this pointerEvent code, there's a weird thing where if you try to click the placeholder text, instead of focusing on the editor element, it... doesn't. This is overriding something habryka did to make spoiler tags work. We discussed this for awhile and this seemed like the best option.
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
  // class for the animation transitions of the bot tips card
  enteredBotTips: {
    opacity: 1
  },
  enteringBotTips: {},
  exitingBotTips: {},
  exitedBotTips: {},
  unmountedBotTips: {},
})

const autosaveInterval = 3000; //milliseconds
const validationInterval = 500; //milliseconds
export const ckEditorName = forumTypeSetting.get() === 'EAForum' ? 'EA Forum Docs' : 'LessWrong Docs'

export type EditorTypeString = "html"|"markdown"|"ckEditorMarkup";
export type LegacyEditorTypeString = EditorTypeString|"draftJS";

export const editorTypeToDisplay: Record<LegacyEditorTypeString,{name: string, postfix?: string}> = {
  html: {name: 'HTML', postfix: '[Admin Only]'},
  ckEditorMarkup: {name: ckEditorName},
  markdown: {name: 'Markdown'},
  draftJS: {name: "DraftJS"},
}

export const nonAdminEditors: EditorTypeString[] = ['ckEditorMarkup', 'markdown']
export const adminEditors: EditorTypeString[] = ['html', 'ckEditorMarkup', 'markdown']

export const getUserDefaultEditor = (user: UsersCurrent|null): EditorTypeString => {
  if (userUseMarkdownPostEditor(user)) return "markdown"
  return "ckEditorMarkup"
}

export function isValidEditorType(editorType: string): editorType is EditorTypeString {
  return editorType in editorTypeToDisplay && editorType !== 'draftJS';
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

export interface FormProps {
  commentMinimalistStyle?: boolean
  maxHeight?: boolean,
}

interface EditorProps {
  ref?: MutableRefObject<Editor|null>,
  currentUser: UsersCurrent|null,
  label?: string,
  formVariant?: "default" | "grey",
  formType: "edit"|"new",
  documentId?: string,
  collectionName: CollectionNameString,
  fieldName: string,
  formProps?: FormProps,

  // Whether to use the CkEditor collaborative editor, ie, this is the
  // contents field of a shared post.
  isCollaborative: boolean,

  // If isCollaborative is set, the access level the user should have
  // with CkEditor. Otherwise ignored.
  accessLevel?: CollaborativeEditingAccessLevel,

  value: EditorContents,
  onChange: (change: EditorChangeEvent) => void,
  onFocus?: (event: AnyBecauseTodo, editor: AnyBecauseTodo) => void,
  placeholder?: string,
  commentStyles?: boolean,
  quickTakesStyles?: boolean,
  answerStyles?: boolean,
  questionStyles?: boolean,
  commentEditor?: boolean,
  hideControls?: boolean,
  maxHeight?: boolean|null,
  hasCommitMessages?: boolean,
  document?: any,
  _classes: ClassesType<typeof styles>,
}

interface EditorComponentState {
  updateType: string,
  commitMessage: string,
  ckEditorReference: any,
  loading: boolean,
  markdownImgErrs: boolean
  editorWarning?: string
}

export const getBlankEditorContents = (editorType: EditorTypeString): EditorContents => {
  return {
    type: editorType,
    value: "",
  }
}

export const isBlank = (editorContents: EditorContents): boolean => {
  if (!editorContents.value)
    return true;
  return editorContents.value.trim() === "";
}

export const getInitialEditorContents = (value: any, document: any, fieldName: string, currentUser: UsersCurrent|null): EditorContents => {
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
  return contents;
}

export const deserializeEditorContents = (contents: SerializedEditorContents): EditorContents|null => {
  if (!contents?.type) {
    return null;
  } else {
    return contents;
  }
}

/**
 * Editor's `submitData` is called in `EditorFormComponent`.
 * Curently, the only situation where we (validly) won't have a ckEditorReference is if a podcaster is editing a post to add a podcast episode to it.
 * 
 * Podcasters don't have permissions to edit the contents of a post, so the editor itself isn't rendered (due to the field permissions).
 * 
 * Simply submitting the post was causing an error in `submitData`, since it expects a ckEditorReference if we're attempting to submit the contents of the post.
 * We just shouldn't try to submit post contents if we'll blow up by doing so (or know that we can't ahead of time).
 */
export const shouldSubmitContents = (editorRef: Editor) => {
  const editorType = editorRef.props.value.type;
  const ckEditorReference = editorRef.state.ckEditorReference;

  if (editorType !== 'ckEditorMarkup') return true;
  return !!ckEditorReference;
}

// HACK: This component needs to be able have a ref so that the parent component
// can call its methods, which means it can't have any HoCs. In particular, it
// can't have 'styles' (since that would add a HoC); instead, it exports its
// styles, and has classes provided by whatever wraps it.
export class Editor extends Component<EditorProps,EditorComponentState> {
  throttledSetCkEditor;
  debouncedCheckMarkdownImgErrs;
  debouncedValidateEditor: typeof this.validateCkEditor

  constructor(props: EditorProps) {
    super(props)

    this.state = {
      updateType: 'minor',
      commitMessage: "",
      ckEditorReference: null,
      loading: true,
      markdownImgErrs: false,
    }

    this.throttledSetCkEditor = debounce((getValue: () => any) => this.setContents("ckEditorMarkup", getValue()), autosaveInterval);
    this.debouncedCheckMarkdownImgErrs = debounce(this.checkMarkdownImgErrs, validationInterval);
    this.debouncedValidateEditor = debounce(this.validateCkEditor, validationInterval);
  }

  async componentDidMount() {
    if (isClient) {
      this.setState({loading: false})
    }
  }

  focus() {
    this.state.ckEditorReference?.focus();
  }

  clear(currentUser: UsersCurrent | null) {
    const editorType = getUserDefaultEditor(currentUser)
    const contents = getBlankEditorContents(editorType);

    this.props.onChange({
      // @RobertM - We assign a space here because empirically it seems to be the only way to reliably clear the contents of a form
      // The use-case where this was discovered was adding a "cancel" button to the expanded quick takes entry form when adopting quick takes on LW
      // The previous implementation failed for reasons that seem similar to those gestured at by the comment in `EditorFormComponent` -> `cleanupSuccessForm`
      // However, trying something similar to the workaround there _didn't_ work.
      // I still don't understand why this works (and results in an empty form, rather than one with a space character).
      contents: { ...contents, value: ' ' },
      autosave: true,
    });
  }

  submitData = async () => {
    let data: any = null
    let dataWithDiscardedSuggestions
    const { updateType, commitMessage, ckEditorReference } = this.state
    const type = this.getCurrentEditorType()
    switch(this.props.value.type) {
      case "markdown":
      case "html":
        data = this.props.value.value;
        break
      case "ckEditorMarkup":
        if (!ckEditorReference) throw Error("Can't submit ckEditorMarkup without attached CK Editor")
        data = ckEditorReference.getData()
        if (ckEditorReference.plugins.has("TrackChangesData"))  {
          // Suggested-edits made by the TrackChanges plugin should be treated as private, until they've actually been 
          // accepted by a post-author/editor. getDataWithDiscardedSuggestions is ckEditor's preferred tool for reliably
          // stripping out all suggestions from the body.
          dataWithDiscardedSuggestions = await ckEditorReference.plugins.get( 'TrackChangesData' ).getDataWithDiscardedSuggestions()
        }
        break
    }

    return {
      originalContents: {type, data},
      commitMessage, updateType,
      dataWithDiscardedSuggestions
    };
  }

  setContents = (editorType: EditorTypeString, value: string) => {
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
      <span className={classes.changeDescriptionLabel}>
        Edit summary (Briefly describe your changes):{" "}
      </span>
      <Input
        className={classes.changeDescriptionInput}
        value={this.state.commitMessage}
        onChange={(ev) => {
          this.setState({ commitMessage: ev.target.value });
        }}
      />
    </div>
  }


  renderEditorComponent = (contents: EditorContents, forceType?: EditorTypeString) => {
    switch (forceType ?? contents.type) {
      case "ckEditorMarkup":
        return this.renderCkEditor(contents)
      case "markdown":
        return this.renderPlaintextEditor(contents)
      case "html":
        return this.renderPlaintextEditor(contents)
    }
  }

  renderPlaceholder = (showPlaceholder: boolean, isCollaborative: boolean) => {
    const { _classes: classes, placeholder } = this.props
    const {className, contentType} = this.getBodyStyles();

    if (showPlaceholder) {
      return <ContentStyles contentType={contentType} className={classNames(className, classes.placeholder, {[classes.placeholderCollaborationSpacing]: isCollaborative})}>
        { placeholder }
      </ContentStyles>
    }
  }

  renderCkEditor = (contents: EditorContents) => {
    const { editorWarning } = this.state
    const { ckEditorReference } = this.state
    const value = (typeof contents?.value === 'string') ? contents.value : ckEditorReference?.getData();
    const {
      documentId,
      collectionName,
      fieldName,
      currentUser,
      commentEditor,
      formType,
      isCollaborative,
      onFocus,
      document,
      _classes: classes,
    } = this.props;
    const CKEditor = commentEditor ? CKCommentEditor : CKPostEditor;
    if (!CKEditor) {
      return <Loading />
    } else {
      const editorProps = {
        data: value,
        documentId: documentId,
        collectionName, fieldName,
        formType: formType,
        userId: currentUser?._id,
        placeholder: this.props.placeholder ?? undefined,
        onChange: (_event: AnyBecauseTodo, editor: AnyBecauseTodo) => {
          this.debouncedValidateEditor(editor.model.document)
          // If transitioning from empty to nonempty or nonempty to empty,
          // bypass throttling. These cases don't have the performance
          // implications that motivated having throttling in the first place,
          // and this prevents a timing bug with form-clearing on submit.
          if (!editor.data.model.hasContent(editor.model.document.getRoot('main'))) {
            this.throttledSetCkEditor.cancel();
            this.setContents("ckEditorMarkup", editor.getData());
          } else {
            this.throttledSetCkEditor(() => editor.getData())
          }
        },
        onFocus,
        onReady: (editor: any) => this.setState({ckEditorReference: editor}),
        document,
      }

      // if document is shared with at least one user, it will render the collaborative ckEditor (note: this costs a small amount of money per document)
      //
      // requires _id because before the draft is saved, ckEditor loses track of what you were writing when turning collaborate on and off (and, meanwhile, you can't actually link people to a shared draft before it's saved anyhow)
      // TODO: figure out a better solution to this problem.

      return <div
        className={classNames(
          this.getHeightClass(),
          classes.ckEditorStyles,
          this.props.formVariant === "grey" && classes.ckEditorGrey,
        )}
        onClick={this.interceptDetailsBlockClick.bind(this)}
      >
        {editorWarning && <WarningBanner message={editorWarning} />}
        {isCollaborative
          ? <CKPostEditor key="ck-collaborate"
              {...editorProps}
              isCollaborative={true}
              accessLevel={this.props.accessLevel}
            />
          : <CKEditor key="ck-default" { ...editorProps } />}
      </div>
    }
  }

  /**
   * When we click on a .detailsBlockTitle element, we want to toggle whether
   * the corresponding .detailsBlock is open or closed. We do this with our own
   * event handler, rather than a <details> tag (which is used outside the
   * editor), because we need finer control of click targets; we don't want
   * clicking on the text in the title to open/close the block, since you're
   * probably trying to place the cursor, and that's disruptive.
   */
  interceptDetailsBlockClick = (ev: React.MouseEvent<HTMLElement>) => {
    // Get the exact element that was clicked on. We can't use ev.target for
    // this because React gives us the element that the event handler was bound
    // to, but we want a more specific target than that.
    //
    // Normally getting the actual target would be problematic, because it can
    // point to a child of the element of interest such as a text node. But in
    // this case, that's what we want--click events on the text node inside the
    // title should not trigger expand/collapse, but clicks on the background
    // should.
    const target = ev.nativeEvent?.target;
    if (!target) return;

    // HACK: Pointer events don't distinguish between clicking on a ::before
    // pseudo-element and clicking on its parent, but we know the expand-arrow
    // will fill the left edge of the title block, so use `offsetX`.
    if ((target as HTMLElement).classList?.contains("detailsBlockTitle")
      && ev.nativeEvent.offsetX < 24
    ) {
      const parentElement = (target as HTMLElement).parentElement;
      if (parentElement?.classList.contains("detailsBlock")) {
        if (parentElement.classList.contains("closed")) {
          parentElement.classList.remove("closed");
        } else {
          parentElement.classList.add("closed");
        }
      }
    }
  }

  validateCkEditor = (document: AnyBecauseTodo) => {
    const result = checkEditorValid(document, this.props.currentUser, this.props.commentEditor)
    this.setState({editorWarning: result.message})
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

  getRows() {
    const {commentStyles, quickTakesStyles} = this.props;
    if (commentStyles) {
      return commentEditorHeightRows;
    }
    if (quickTakesStyles) {
      return quickTakesEditorHeightRows;
    }
    return postEditorHeightRows;
  }

  renderPlaintextEditor = (contents: EditorContents) => {
    const {markdownImgErrs} = this.state;
    const {_classes: classes, questionStyles, formProps} = this.props;
    const {contentType} = this.getBodyStyles();
    const value = contents.value || "";
    return <div>
      { this.renderPlaceholder(!value, false) }
      <ContentStyles contentType={contentType}  className={classNames({[classes.commentBodyStylesMinimalist]: formProps?.commentMinimalistStyle})}>
        <Input
          className={classNames(classes.markdownEditor, this.getBodyStyles(), {[classes.questionWidth]: questionStyles, [classes.commentBodyStylesMinimalist]: formProps?.commentMinimalistStyle}
          )}
          value={value}
          onChange={(ev) => {
            this.setContents(contents.type, ev.target.value);
          }}
          multiline={true}
          rows={this.getRows()}
          rowsMax={99999}
          fullWidth={true}
          disableUnderline={true}
        />
      </ContentStyles>
      {markdownImgErrs && contents.type === 'markdown' && <Typography component='aside' variant='body2' className={classes.markdownImgErrText}>
        Your Markdown contains at least one link to an image served over an insecure HTTP{' '}
        connection. You should update all links to images so that they are served over a{' '}
        secure HTTPS connection (i.e. the links should start with <em>https://</em>).
      </Typography>}
    </div>
  }

  getBodyStyles = (): {className: string, contentType: "comment"|"answer"|"post"} => {
    const {
      _classes: classes,
      commentStyles,
      answerStyles,
      quickTakesStyles,
    } = this.props
    if (commentStyles && answerStyles) {
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
    if (quickTakesStyles) {
      return {
        className: classes.postBodyStyles,
        contentType: "comment",
      }
    }
    return {
      className: classes.postBodyStyles,
      contentType: "post",
    }
  }

  getHeightClass = () => {
    const {
      _classes: classes,
      commentStyles,
      quickTakesStyles,
      questionStyles,
      maxHeight,
      formProps,
    } = this.props;

    if (formProps?.commentMinimalistStyle) {
      return classes.commentMinimalistEditorHeight;
    }

    return classNames({
      [classes.commentEditorHeight]: commentStyles,
      [classes.quickTakesEditorHeight]: quickTakesStyles,
      [classes.questionEditorHeight]: questionStyles && !commentStyles,
      [classes.postEditorHeight]: !commentStyles && !questionStyles,
      [classes.maxHeight]: maxHeight,
    });
  }

  render() {
    const { loading } = this.state
    const {label, formVariant, _classes: classes} = this.props;
    const {className, contentType} = this.getBodyStyles();

    const isGrey = formVariant === "grey";
    const forceEditorType = isGrey ? "ckEditorMarkup" : undefined;

    return <div>
      {label && isGrey &&
        <SectionTitle title={label} noTopMargin titleClassName={classes.sectionTitle} />
      }
      <ContentStyles className={classNames(classes.editor, className)} contentType={contentType}>
        {label && !isGrey &&
          <FormLabel className={classes.label}>{label}</FormLabel>
        }
        {loading
          ? <Loading/>
          : this.renderEditorComponent(this.props.value, forceEditorType)
        }
        {!isGrey && this.renderUpdateTypeSelect()}
      </ContentStyles>
      {!isGrey && this.renderCommitMessageInput()}
    </div>
  }
};
