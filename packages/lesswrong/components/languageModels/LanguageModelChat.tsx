import React, { useEffect, useRef, useState, useCallback, useContext, forwardRef, useImperativeHandle } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import DeferRender from '../common/DeferRender';
import Button from '@material-ui/core/Button';
import { useMessages } from '../common/withMessages';
import Select from '@material-ui/core/Select';
import CloseIcon from '@material-ui/icons/Close';
import { useLocation } from "../../lib/routeUtil";
import { NewLlmMessage, PromptContextOptions, RAG_MODE_SET, RagModeType, useLlmChat } from './LlmChatWrapper';
import type { Editor } from '@ckeditor/ckeditor5-core';
import CKEditor from '@/lib/vendor/ckeditor5-react/ckeditor';
import { getCkCommentEditor } from '@/lib/wrapCkEditor';
import { forumTypeSetting } from '@/lib/instanceSettings';
import { mentionPluginConfiguration } from '@/lib/editor/mentionsConfig';
import { ckEditorStyles } from '@/themes/stylePiping';
import { HIDE_LLM_CHAT_GUIDE_COOKIE } from '@/lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { AutosaveEditorStateContext } from '../editor/EditorFormComponent';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { usePostsPageContext } from '../posts/PostsPage/PostsPageContext';
import Input from '@material-ui/core/Input/Input';
import { danglingSentencesPrompt, Prompt, rightBranchingPrompt } from '@/lib/promptLibrary';
import { useEditorCommands } from '../editor/EditorCommandsContext';

const styles = (theme: ThemeType) => ({
  root: {
    overflowY: "scroll",
    background: theme.palette.background.pageActiveAreaBackground,
    borderRadius: 6,
    padding: 6,
  },
  subRoot: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    ...theme.typography.body2,
  },
  submission: {
    margin: 10,
    display: "flex",
    padding: 20,
    ...theme.typography.commentStyle,
  },
  editor: {
    minHeight: 60,
    '& .ck.ck-content': {
      minHeight: 60,
      '&::before': {
        color: theme.palette.error.main + ' !important',
      }
    },
    ...ckEditorStyles(theme),
    overflowY: 'scroll',
    paddingLeft: 20,
    paddingTop: 20,
    fontSize: theme.typography.body2.fontSize,
    '& blockquote, & li': {
      fontSize: '1.0rem'
    }
  },
  inputTextbox: {
    margin: 10,
    borderRadius: 8,
    maxHeight: "40vh",
    backgroundColor: theme.palette.panelBackground.commentNodeEven,
    overflowY: 'hidden',
    overflowX: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    display: "flex",
    flexDirection: "column"
  },
  submitButton:{
    width: "fit-content",
    fontSize: "16px",
    color: theme.palette.lwTertiary.main,
    marginLeft: "5px",
    "&:hover": {
      opacity: .5,
      backgroundColor: "none",
    },
  },
  editorButtons: {
    display: "flex",
    justifyContent: "flex-end",
    padding: 4,
  },
  welcomeGuide: {
    margin: 10,
    marginTop: 9,
    display: "flex",
    flexDirection: "column",
    borderRadius: 8
  },
  welcomeGuideText: {
    padding: 20,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 10,
  },
  welcomeGuideButton: {
    cursor: "pointer",
    opacity: 0.8,
    alignSelf: "flex-start",
    fontStyle: "italic"
  },
  chatMessage: {
    padding: 20,
    margin: 10,
    borderRadius: 8,
    backgroundColor: theme.palette.grey[100],
    position: "relative",
  },
  userMessage: {
    backgroundColor: theme.palette.panelBackground.translucent
  },
  errorMessage: {
    backgroundColor: theme.palette.error.light,
  },
  messages: {
    overflowY: "scroll",
    flexGrow: 1,
    //the last child has margin bottom 0 (doesn't work)
    "& > *:last-child": {
      marginBottom: 0
    }
  },
  options: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginLeft: 10
  },
  checkbox: {
    padding: 8
  },
  select: {
    // TODO: maybe really the styling of the options section should be flex display and flex grow stuff
    maxWidth: 250,
  },
  ragModeSelect: {
  },
  menuItem: {
    zIndex: theme.zIndexes.languageModelChat + 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  deleteConvoIcon: {
    cursor: "pointer",
    opacity: 0,
    width: 16,
    height: 16,
    position: "absolute",
    right: 0,
    top: 0,
    marginLeft: "auto",
    flexGrow: 1,
    '&:hover': {
      opacity: 1,
    },
  },
  loadingSpinner: {
    marginTop: 10
  },
  convoListExpanded: {
    maxHeight: "unset !important",
  },
  chatMessageContent: {
    maxHeight: 50,
    overflow: "hidden",
  },
  chatMessageContentExpand: {
    maxHeight: "50vh",
    overflowY: "scroll"
  },
  collapsedIcon: {
    transform: "rotate(-90deg)",
  },
  expandCollapseIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    '&:hover': {
      color: theme.palette.grey[600],
    },
    height: 16,
    width: 16,
    position: "absolute",
    left: 6,
    top: 6,
  },
  conversation2Item: {
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    position: "relative",
    width: "calc(50% - 8px)",
    border: theme.palette.border.faint,
    borderRadius: 4,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 4,
    paddingBottom: 4,
    '&:hover $convoIcon, &:hover $deleteConvoIcon': {
      opacity: 1,
    },
  },
  convoList: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    maxHeight: 30,
    overflow: "hidden",
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
  },
  convosListWrapper: {
    padding: 6,
    display: "flex",
  },
  convosButtons: {
    display: "flex",
    justifyContent: "space-between",
  },
  convoItemIcons: {
    opacity: 0,
    position: "absolute",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    right: 0,
    top: 0,
  },
  convoIcon: {
    cursor: "pointer",
    height: 16,
    width: 16,
    opacity: 0,
    margin: 4,
    '&:hover': {
      opacity: 1,
    },
  },
  suggestionIcon: {
    cursor: "pointer",
    height: 16,
    width: 16,
    opacity: 0.5,
    marginLeft: 8,
    '&:hover': {
      opacity: 1,
    },
  },
  icon: {
    cursor: "pointer",
    height: 20,
    width: 20,
    marginTop: 6,
    opacity: 0.5,
    '&:hover': {
      opacity: 1,
    },
  },
  userFeedbackPromptInput: {
    backgroundColor: theme.palette.background.default,
    borderRadius: 4,
    padding: '4px 7px',
    width: 240
  },
  postSuggestionsButton: {
    border: theme.palette.border.faint,
    cursor: 'pointer',
    opacity: 0.8,
    width: "calc(50% - 8px)",
    alignSelf: 'flex-start',
    ...theme.typography.body2,
    fontSize: "1.1rem",
    marginBottom: 4,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 4,
    whiteSpace: "nowrap",
    '& $suggestionIcon': {
      opacity: 0,
    },
    '&:hover $suggestionIcon': {
      opacity: .5,
    },
  },
  postSuggestionsWrapper: {
    backgroundColor: theme.palette.background.default,
    borderRadius: 4,
    padding: '4px 7px',
    width: 240
  },
  postSuggestionsList: {
    display: "flex",
    flex: 1,
    gap: "8px",
    maxHeight: 32,
    flexWrap: "wrap",
    overflow: "hidden",
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
  }
});

const NEW_CONVERSATION_MENU_ITEM = "New Conversation";

const LLMChatMessage = ({message, classes, index}: {
  message: LlmMessagesFragment | NewLlmMessage,
  classes: ClassesType<typeof styles>,
  index: number,
}) => {
  const { ContentItemBody, ContentStyles, ForumIcon, Row } = Components;
  const [expanded, setExpanded] = useState(true);

  const { role, content } = message;

  return <Row alignItems="flex-start">
    <div className={classNames(classes.chatMessage, 
      role === 'user' && classes.userMessage,
      role === 'error' && classes.errorMessage,
    )}>
      <ForumIcon icon={"ExpandMore"} className={classNames(classes.expandCollapseIcon, !expanded && classes.collapsedIcon)} onClick={() => setExpanded(!expanded)} />
      <ContentStyles contentType="llmChat">
        <ContentItemBody
          className={classNames(classes.chatMessageContent, expanded && classes.chatMessageContentExpand)}
          dangerouslySetInnerHTML={{__html: content}}
        />
      </ContentStyles>
    </div>
  </Row>
}

const LLMInputTextbox = ({ onSubmit, classes }: {
  onSubmit: (message: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { ContentStyles } = Components;
  
  const [currentMessage, setCurrentMessage] = useState('');
  const ckEditorRef = useRef<CKEditor<any> | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const editorConfig = {
    placeholder: 'Type here.  Ctrl/Cmd + Enter to submit.',
    mention: mentionPluginConfiguration,
  };

  const submitEditorContentAndClear = useCallback(() => {
    const currentEditorContent = editorRef.current?.getData();
    currentEditorContent && void onSubmit(currentEditorContent);
    setCurrentMessage('');
  }, [onSubmit]);

  useGlobalKeydown((event: KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();
      submitEditorContentAndClear();
    }

    // Insert current page URL on Ctrl/Cmd + Shift + U
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
      event.stopPropagation();
      event.preventDefault();
      const editor = editorRef.current;
      if (editor) {
        editor.model.change((writer) => {
          const insertPosition = editor.model.document.selection.getFirstPosition();
          const url = window.location.href;
          if (insertPosition) {
            writer.insertText(url, insertPosition);
          }
          // Focus the editor after inserting text
          editor.editing.view.focus();
        });
      }
    }
  });

  const submitButton = <div className={classes.editorButtons}>
    <Button
      type='submit'
      id='llm-submit-button'
      className={classes.submitButton}
      onClick={submitEditorContentAndClear}
    >
      Submit
    </Button>
  </div>;

  return (
    <ContentStyles className={classes.inputTextbox} contentType='comment'>
      <div className={classes.editor}>
        <CKEditor
          data={currentMessage}
          ref={ckEditorRef}
          editor={getCkCommentEditor()} // Unsure if this should be kept. forumTypeSetting.get()
          isCollaborative={false}
          onChange={(_event, editor: Editor) => {
            // debouncedValidateEditor(editor.model.document)
            // If transitioning from empty to nonempty or nonempty to empty,
            // bypass throttling. These cases don't have the performance
            // implications that motivated having throttling in the first place,
            // and this prevents a timing bug with form-clearing on submit.
            setCurrentMessage(editor.getData());
  
            // if (!editor.data.model.hasContent(editor.model.document.getRoot('main'))) {
            //   throttledSetCkEditor.cancel();
            //   setCurrentMessage(editor.getData());
            // } else {
            //   throttledSetCkEditor(() => editor.getData())
            // }
          }}
          onReady={(editor) => {
            editorRef.current = editor;
          }}
          config={editorConfig}
        />
      </div>
      {submitButton}
    </ContentStyles>
  );
};

const welcomeGuideHtml = [
  `<h1>Welcome to the LessWrong LLM Chat!</h1>`,
  `<ul><li>The LLM chat interface is currently hooked up to Claude Sonnet 3.5</li>`,
  `<li>LaTeX is supported both on input and output.`,
  `<li style="color: #bf360c;">The LessWrong team will read conversations to help us with product iteration during development.</li></ul>`,
  `<p><strong>Posts and comments may be loaded into the context window based on your <em>first message</em> (and based on the current post you are viewing).</strong></p>`,
].join('');

type CurrentPostContext = {
  currentPostId: string;
  postContext: Exclude<PromptContextOptions['postContext'], undefined>
} | {
  currentPostId?: undefined;
  postContext?: undefined;
};

function useCurrentPostContext(): CurrentPostContext {
  const { query, location } = useLocation();
  const { pathname } = location;
  const parsedPostId = pathname.match(/\/posts\/([^/]+)\/[^/]+/)?.[1];

  if (query.postId) {
    return {
      currentPostId: query.postId,
      postContext: 'post-editor'
    };
  }

  if (parsedPostId) {
    return {
      currentPostId: parsedPostId,
      postContext: 'post-page'
    };
  }

  return {};
}

const PostSuggestionsPromptInput = ({classes, prompt}: {classes: ClassesType<typeof styles>, prompt: Prompt}) => {
  const { ForumIcon, Row, LWTooltip, Loading } = Components;

  const [edit, setEdit] = useState(false);
  const [userFeedbackPrompt, setUserFeedbackPrompt] = useState(prompt.prompt);
  const { getLlmFeedbackCommand, cancelLlmFeedbackCommand, llmFeedbackCommandLoadingSourceId } = useEditorCommands();

  const handleSubmit = useCallback(async () => {
    if (getLlmFeedbackCommand) {
      await getLlmFeedbackCommand(userFeedbackPrompt, prompt.title);
    }
    // setEdit(false);
  }, [getLlmFeedbackCommand, userFeedbackPrompt, prompt.title]);

  const handleCancel = useCallback(() => {
    if (cancelLlmFeedbackCommand) {
      cancelLlmFeedbackCommand();
    }
    // setEdit(false);
  }, [cancelLlmFeedbackCommand]);

  if (!getLlmFeedbackCommand) {
    return null;
  }

  if (prompt.title === llmFeedbackCommandLoadingSourceId) {
    return <div className={classes.postSuggestionsButton} onClick={handleCancel}>
      <Row alignItems="center" gap={4}>
        <LWTooltip title="Generating suggestions, click to cancel" placement="left">
          <Loading />
        </LWTooltip>
      </Row>
    </div>
  }

  return <div onClick={handleSubmit} className={classes.postSuggestionsButton}>
    <Row alignItems="center" gap={4}>
      <LWTooltip title={prompt.description} placement="left">
        <div>{prompt.title}</div>
      </LWTooltip>
      <LWTooltip title={edit ? "Cancel" : "Edit Prompt"} placement="right"> 
        <ForumIcon className={classes.suggestionIcon} icon={edit ? "Clear" : "Edit"} onClick={() => setEdit(!edit)}/>
      </LWTooltip>
    </Row>
    {/* <div className={classes.postSuggestionsWrapper} style={{display: edit ? "block" : "none"}}>
      <Input
        id="user-feedback-prompt-input"
        className={classes.userFeedbackPromptInput}
        type="text"
        placeholder="Prompt"
        value={userFeedbackPrompt}
        onChange={(e) => setUserFeedbackPrompt(e.target.value)}
        multiline
        rows={15}
        disableUnderline
      />
    </div> */}
  </div>
}

export const PostSuggestionPromptList = ({classes, children}: {classes: ClassesType<typeof styles>, children: React.ReactNode}) => {
  const { ForumIcon, LWTooltip } = Components;
  const [isListExpanded, setIsListExpanded] = useState(false);

  return <div className={classes.convosListWrapper}>
    <LWTooltip title={isListExpanded ? "Show Fewer Conversations" : "Show All Conversations"}>
      <ForumIcon icon="ExpandMore" className={classNames(classes.icon, !isListExpanded && classes.collapsedIcon)} onClick={() => setIsListExpanded(!isListExpanded)} />
    </LWTooltip>
    <div className={classNames(classes.postSuggestionsList, isListExpanded && classes.convoListExpanded)}>
      {children}
    </div>
  </div>
}

export const ChatInterface = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { LlmChatMessage, Loading, MenuItem, ContentStyles, ContentItemBody, ForumIcon, LWTooltip } = Components;

  const { currentConversation, setCurrentConversation, archiveConversation, orderedConversations, submitMessage, currentConversationLoading } = useLlmChat();
  const { currentPostId, postContext } = useCurrentPostContext();
  const { autosaveEditorState } = useContext(AutosaveEditorStateContext);
  const { getLlmFeedbackCommand } = useEditorCommands();

  const [ragMode, setRagMode] = useState<RagModeType>('Auto');
  const { flash } = useMessages();

  const messagesRef = useRef<HTMLDivElement>(null);
  const lastMessageLengthRef = useRef(0);
  const previousMessagesLengthRef = useRef(0);

  const [isConvoListExpanded, setIsConvoListExpanded] = useState(false);

  // Scroll to bottom when new messages are added or the content of the last message grows due to streaming
  useEffect(() => {
    const messages = currentConversation?.messages ?? [];
    const currentMessagesLength = messages.length;

    const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
      if (messagesRef.current) {
        messagesRef.current.scrollTo({ 
          top: messagesRef.current.scrollHeight, 
          behavior 
        });
      }
    };

    const scrollToBottomIfNearBottom = () => {
      if (messagesRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = messagesRef.current;
        const scrollThreshold = clientHeight * 0.2; // 20% of the visible area
        const isScrolledNearBottom = scrollHeight - scrollTop <= clientHeight + scrollThreshold;

        if (isScrolledNearBottom) {
          scrollToBottom('smooth');
        }
      }
    };

    // New message added
    if (currentMessagesLength > previousMessagesLengthRef.current) {
      scrollToBottom();
      previousMessagesLengthRef.current = currentMessagesLength;
    } 
    // Content of the last message changed (e.g., streaming)
    else if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const currentLastMessageLength = lastMessage.content.length;

      if (currentLastMessageLength !== lastMessageLengthRef.current) {
        lastMessageLengthRef.current = currentLastMessageLength;
        
        // Delay scroll check slightly to allow for content update
        setTimeout(scrollToBottomIfNearBottom, 100);
      }
    }
  }, [currentConversation?.messages]);

  const [cookies, setCookies] = useCookiesWithConsent([HIDE_LLM_CHAT_GUIDE_COOKIE])
  const showGuide = cookies[HIDE_LLM_CHAT_GUIDE_COOKIE] !== "true";
  const setShowGuide = (show: boolean) => {
    setCookies(HIDE_LLM_CHAT_GUIDE_COOKIE, show ? "false" : "true")
  }

  const llmChatGuide = <ContentStyles contentType="llmChat" className={classes.welcomeGuide}>
    <div 
      onClick={() => setShowGuide(!showGuide)} 
      className={classes.welcomeGuideButton}
    >
      {showGuide ? "Hide Guide" : "Show LLM Guide"}
    </div>
    {showGuide && <ContentItemBody
      className={classNames(classes.welcomeGuideText)}
      dangerouslySetInnerHTML={{__html: welcomeGuideHtml}}
    />}
  </ContentStyles>

  const messagesForDisplay = <div className={classes.messages} ref={messagesRef}>
    {llmChatGuide}
    {currentConversation?.messages.map((message, index) => (
      <LlmChatMessage key={index} message={message} index={index} />
    ))}
  </div>

  const exportHistoryToClipboard = () => {
    if (!currentConversation) return
    const conversationHistory = currentConversation.messages.filter(({role}) => ['user', 'assistant', 'user-context'].includes(role))
    const formattedChatHistory = conversationHistory.map(({role, content}) => `<strong>${role.toUpperCase()}:</strong> ${content}`).join("\n")
    void navigator.clipboard.writeText(formattedChatHistory)
    flash('Chat history copied to clipboard')
  }

  const onSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelection = event.target.value;
    const newSelectionId = newSelection === "New Conversation"
      ? undefined
      : newSelection;

    setCurrentConversation(newSelectionId);
  }

  const deleteConversation = (ev: React.MouseEvent, conversationId: string) => {
    // TODO: figure out if we need both of these or just one (i.e. to prevent selection of the menu item)
    ev.preventDefault();
    ev.stopPropagation();
    archiveConversation(conversationId);
  };

  const ragModeSelect = <Select 
    onChange={(e) => setRagMode(e.target.value as RagModeType)}
    value={ragMode}
    disableUnderline
    className={classes.ragModeSelect}
  >
    {RAG_MODE_SET.map((ragMode) => (
      <MenuItem key={ragMode} value={ragMode}>
        {ragMode}
      </MenuItem>
    ))}
  </Select>

  const copyFirstMessageToClipboard = (conversationId: string) => {
    const conversation = orderedConversations.find(c => c._id === conversationId);
    if (conversation) {
      void navigator.clipboard.writeText(conversation.messages[0].content);
      flash('First message copied to clipboard');
    }
  }

  {/* <LWTooltip title="Copy Chat History to Clipboard">
    <ForumIcon icon="ClipboardDocument" className={classes.icon} onClick={exportHistoryToClipboard} />
  </LWTooltip> */}

  const options = <div className={classes.options}>
    <LWTooltip title="New LLM Chat">
      <ForumIcon icon="Add" className={classes.icon} onClick={() => setCurrentConversation()} />
    </LWTooltip>
    <LWTooltip title="Copy Chat History to Clipboard">
      <ForumIcon icon="ClipboardDocument" className={classes.icon} onClick={exportHistoryToClipboard} />
    </LWTooltip>
  </div>

  const handleSubmit = useCallback(async (message: string) => {
    if (autosaveEditorState) {
      await autosaveEditorState();
    }
    submitMessage({ query: message, ragMode, currentPostId, postContext });
  }, [autosaveEditorState, currentPostId, postContext, submitMessage, ragMode]);

  const [expandConvosList, setExpandConvosList] = useState<boolean>(false);

  return <>
    <div className={classes.subRoot}>
      {messagesForDisplay}
      {currentConversationLoading && <Loading className={classes.loadingSpinner}/>}
      <LLMInputTextbox onSubmit={handleSubmit} classes={classes} />
      <div className={classes.convoList}>
        <LWTooltip title="New LLM Chat">
          <ForumIcon icon="Add" className={classes.icon} onClick={() => setCurrentConversation()} />
        </LWTooltip>
        {orderedConversations.map(({ title, _id, messages }, index) => (
          <div key={index} className={classes.conversation2Item} onClick={() => setCurrentConversation(_id)}>
            {title ?? "...Title Pending..."}
          </div>
        ))}
        {orderedConversations.length > 2 && <span onClick={() => setExpandConvosList(!expandConvosList)}>
          {expandConvosList ? "Fewer" : "More"}
        </span>}
      </div>
      {!!getLlmFeedbackCommand && <PostSuggestionPromptList classes={classes}>
        <PostSuggestionsPromptInput classes={classes} prompt={rightBranchingPrompt} />
        <PostSuggestionsPromptInput classes={classes} prompt={danglingSentencesPrompt} />
      </PostSuggestionPromptList>}
    </div>
  </>
}

// Wrapper component needed so we can use deferRender
export const LanguageModelChat = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return <DeferRender ssr={false}>
    <AnalyticsContext pageSectionContext='llmChat'>
      <div className={classes.root}>
        <ChatInterface classes={classes} />
      </div>
    </AnalyticsContext>
  </DeferRender>;
}

const LanguageModelChatComponent = registerComponent('LanguageModelChat', LanguageModelChat, {styles});

const LlmChatMessageComponent = registerComponent('LlmChatMessage', LLMChatMessage, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelChat: typeof LanguageModelChatComponent
    LlmChatMessage: typeof LlmChatMessageComponent
  }
}
