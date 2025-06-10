import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import DeferRender from '../common/DeferRender';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useMessages } from '../common/withMessages';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
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
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import Loading from "../vulcan-core/Loading";
import { MenuItem } from "../common/Menus";

const styles = (theme: ThemeType) => ({
  root: {
    height: "calc(100vh - 190px)"
  },
  subRoot: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
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
    },
    ...ckEditorStyles(theme),
    overflowY: 'scroll',
    paddingLeft: 20,
    paddingTop: 20,
    fontSize: '1.0rem',
    '& blockquote, & li': {
      fontSize: '1.0rem'
    }
  },
  inputTextbox: {
    margin: 10,
    marginTop: 20,
    borderRadius: 4,
    maxHeight: "40vh",
    backgroundColor: theme.palette.panelBackground.commentNodeEven,
    overflowY: 'hidden',
    overflowX: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    display: "flex",
    flexDirection: "column",
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
    padding: "10px",
  },
  welcomeGuide: {
    margin: 10,
    display: "flex",
    flexDirection: "column",
  },
  welcomeGuideText: {
    padding: 20,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 10,
  },
  welcomeGuideButton: {
    cursor: "pointer",
    opacity: 0.8,
    alignSelf: "flex-end",
    fontStyle: "italic",
    marginBottom: 4
  },
  chatMessage: {
    padding: 20,
    margin: 10,
    borderRadius: 10,
    backgroundColor: theme.palette.grey[100],
  },
  chatMessageContent: {
  },
  userMessage: {
    backgroundColor: theme.palette.grey[300],
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
    marginLeft: 10,
    cursor: "pointer",
    opacity: 0.8,
    width: 16
  },
  loadingSpinner: {
    marginTop: 10
  },
});

const NEW_CONVERSATION_MENU_ITEM = "New Conversation";

const LLMChatMessageInner = ({message, classes}: {
  message: LlmMessagesFragment | NewLlmMessage,
  classes: ClassesType<typeof styles>,
}) => {
  const { role, content } = message;

  return <ContentStyles contentType="llmChat" className={classes.chatMessageContent}>
    <ContentItemBody
      className={classNames(classes.chatMessage, {
        [classes.userMessage]: role === 'user',
        [classes.errorMessage]: role === 'error'
      })}
      dangerouslySetInnerHTML={{__html: content ?? ''}}
    />
  </ContentStyles>
}

export const LlmChatMessage = registerComponent('LlmChatMessage', LLMChatMessageInner, {styles});

const LLMInputTextbox = ({onSubmit, classes}: {
  onSubmit: (message: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const ckEditorRef = useRef<CKEditor<any> | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // TODO: we probably want to come back to this and enable cloud services for image uploading
  const editorConfig = {
    placeholder: 'Type here.  Ctrl/Cmd + Enter to submit.',
    mention: mentionPluginConfiguration,
  };

  const submitEditorContentAndClear = useCallback(() => {
    const currentEditorContent = editorRef.current?.getData();
    currentEditorContent && void onSubmit(currentEditorContent);
    setCurrentMessage('');
  }, [onSubmit]);

  // We need to pipe through the `conversationId` and do all of this eventListener setup/teardown like this because
  // otherwise messages get submitted to whatever conversation was "current" when the editor was initially loaded
  // Running this useEffect whenever either the conversationId or onSubmit changes ensures we remove and re-attach a fresh event listener with the correct "targets"
  useEffect(() => {
    const currentEditorRefValue = ckEditorRef.current;

    const options = { capture: true };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
        event.stopPropagation();
        event.preventDefault();
        submitEditorContentAndClear();
      }
    };
  
    const internalEditorRefInstance = (currentEditorRefValue as AnyBecauseHard).domContainer?.current;
    if (internalEditorRefInstance) {
      internalEditorRefInstance.addEventListener('keydown', handleKeyDown, options);
    }

    return () => {
      const internalEditorRefInstance = (currentEditorRefValue as AnyBecauseHard)?.domContainer?.current;
      if (internalEditorRefInstance) {
        internalEditorRefInstance.removeEventListener('keydown', handleKeyDown, options);
      }
    }
  }, [onSubmit, submitEditorContentAndClear]);

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

  // TODO: styling and debouncing
  return <ContentStyles className={classes.inputTextbox} contentType='comment'>
    <div className={classes.editor}>
      <CKEditor
        data={currentMessage}
        ref={ckEditorRef}
        editor={getCkCommentEditor()}
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
}

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

export const ChatInterface = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { currentConversation, setCurrentConversation, archiveConversation, orderedConversations, submitMessage, currentConversationLoading } = useLlmChat();
  const { currentPostId, postContext } = useCurrentPostContext();
  const { autosaveEditorState } = useContext(AutosaveEditorStateContext);

  const [ragMode, setRagMode] = useState<RagModeType>('Auto');
  const { flash } = useMessages();

  const messagesRef = useRef<HTMLDivElement>(null);
  const lastMessageLengthRef = useRef(0);
  const previousMessagesLengthRef = useRef(0);

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
      const currentLastMessageLength = lastMessage.content?.length ?? 0;

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
      <LlmChatMessage key={index} message={message} />
    ))}
  </div>

  const exportHistoryToClipboard = () => {
    if (!currentConversation) return
    const conversationHistory = currentConversation.messages.filter(({role}) => role && ['user', 'assistant', 'user-context'].includes(role))
    const formattedChatHistory = conversationHistory.map(({role, content}) => `<strong>${role?.toUpperCase()}:</strong> ${content}`).join("\n")
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

  const conversationSelect = <Select 
    onChange={onSelect} 
    value={currentConversation?._id ?? NEW_CONVERSATION_MENU_ITEM}
    disableUnderline
    className={classes.select}
    renderValue={(conversationId: string) => orderedConversations.find(c => c._id === conversationId)?.title ?? NEW_CONVERSATION_MENU_ITEM}
    >
      {
        orderedConversations.map(({ title, _id }, index) => (
          <MenuItem key={index} value={_id} className={classes.menuItem}>
            {title ?? "...Title Pending..."}
            <CloseIcon onClick={(ev: React.MouseEvent) => deleteConversation(ev, _id)} className={classes.deleteConvoIcon} />
          </MenuItem>
      ))}
      <MenuItem value={NEW_CONVERSATION_MENU_ITEM} className={classes.menuItem}>
        New Conversation
      </MenuItem>
    </Select>;

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


  const options = <div className={classes.options}>
    <Button onClick={() => setCurrentConversation()}>
      New Chat
    </Button>
    <Button onClick={exportHistoryToClipboard} disabled={!currentConversation}>
      Export
    </Button>
    {conversationSelect}
    {ragModeSelect}
  </div>  

  const handleSubmit = useCallback(async (message: string) => {
    if (autosaveEditorState) {
      await autosaveEditorState();
    }
    submitMessage({ query: message, ragMode, currentPostId, postContext });
  }, [autosaveEditorState, currentPostId, postContext, submitMessage, ragMode]);

  return <div className={classes.subRoot}>
    {messagesForDisplay}
    {currentConversationLoading && <Loading className={classes.loadingSpinner}/>}
    <LLMInputTextbox onSubmit={handleSubmit} classes={classes} />
    {options}
  </div>
}


// Wrapper component needed so we can use deferRender
const LanguageModelChat = ({classes}: {
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

export default registerComponent('LanguageModelChat', LanguageModelChat, {styles});



