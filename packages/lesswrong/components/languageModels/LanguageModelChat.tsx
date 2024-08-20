// TODO: Import component in components.ts
import React, { useEffect, useRef, useState, useCallback, useMemo, useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useMutation } from '@apollo/client';
import classNames from 'classnames';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import DeferRender from '../common/DeferRender';
import Checkbox from "@material-ui/core/Checkbox";
import Button from '@material-ui/core/Button';
import { useMessages } from '../common/withMessages';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import { hideScrollBars } from '../../themes/styleUtils';
import CloseIcon from '@material-ui/icons/Close';
import { useLocation } from "../../lib/routeUtil";
import { LlmStreamMessage, useOnServerSentEvent } from '../hooks/useUnreadNotifications';
import { useCurrentUser } from '../common/withUser';
import { LlmChatContext } from './LlmChatWrapper';

const LLM_STORAGE_KEY = 'llmConversations'
const PLACEHOLDER_TITLE = "LLM Chat: New Conversation"
    

const styles = (theme: ThemeType) => ({
  root: {
  },
  chatInterfaceRoot: {

  },
  submission: {
    margin: 10,
    display: "flex",
    padding: 20,
    ...theme.typography.commentStyle,
  },
  inputTextbox: {
    padding: 20,
    width: "100%",
    minHeight: 100,
    maxHeight: 200,
    // '& .textarea': {
    //   ...hideScrollBars
    // }
  },
  chatMessage: {
    padding: 16,
    margin: 10,
    borderRadius: 10
  },
  chatMessageContent: {
  },
  userMessage: {
    backgroundColor: theme.palette.grey[300],
  },
  assistantMessage: {
    backgroundColor: theme.palette.grey[100],
  },
  messages: {
    maxHeight: "75vh",
    overflowY: "scroll",
  },
  options: {
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
  menuItem: {
    zIndex: theme.zIndexes.commentBoxPopup + 10,
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
  }
});

interface ClaudeMessage {
  role: string
  content: string
  displayContent?: string
}

interface ClaudeConversation {
  messages: ClaudeMessage[]
  title: string
  createdAt: Date,
  lastUpdated: Date
}

interface PromptContextOptions {
  query: string
  postId?: string,
  useRag?: boolean
  includeComments?: boolean
}

type ClaudeConversationWithOptionalTitle = Omit<ClaudeConversation, 'title'> & { title?: string }

type LlmConversations = Record<string, ClaudeConversation>

const LLMChatMessage = ({message, classes}: {
  message: ClaudeMessage,
  classes: ClassesType<typeof styles>,
}) => {

  const { ContentItemBody, ContentStyles } = Components

  const { role, content, displayContent } = message

  return <ContentStyles contentType="llmChat" className={classes.chatMessageContent}>
    <ContentItemBody
      className={classNames(classes.chatMessage, {[classes.userMessage]: role==='user', [classes.assistantMessage]: role==='assistant'})}
      dangerouslySetInnerHTML={{__html: displayContent ?? content}}
    />
</ContentStyles>
}

const LLMInputTextbox = ({onSubmit, classes}: {
  onSubmit: (message: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [currentMessage, setCurrentMessage] = useState('')

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();
      void onSubmit(currentMessage);
      setCurrentMessage('')
    }
  }

  // TODO: replace with something better
  return <Input
    value={currentMessage}
    onChange={(event) => setCurrentMessage(event.target.value)}
    onKeyDown={handleKeyDown}
    className={classes.inputTextbox}
    placeholder='Type here. Ctrl-Enter to send.'
    multiline
    disableUnderline
  />
}


export const ChatInterface = ({setWindowTitle, classes}: {
  setWindowTitle?: (title: string|undefined) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //TODO: appropriate tracking? 
  const { Loading, MenuItem } = Components;

  const { currentConversationId, conversations, switchConversation, archiveConversation, loading, setLoading }  = useContext(LlmChatContext)!

  const { flash } = useMessages();
  const currentUser = useCurrentUser();

  // TODO: come back and refactor this to use currentRoute & matchPath to get the url parameter instead
  const { location } = useLocation();
  const { pathname } = location;
  const currentPostId = pathname.match(/\/posts\/([^/]+)\/[^/]+/)?.[1];

  const sortedConversations = useMemo(() => {
    return Object.values(conversations).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
  }
  const currentConversation = currentConversationId ? conversations[currentConversationId] : undefined;

  const messagesRef = useRef<HTMLDivElement>(null)
  // useEffect to scroll to bottom of chat history after new message is added
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [currentConversation?.messages.length]);


  const messagesForDisplay = <div className={classes.messages} ref={messagesRef}>
    {currentConversation?.messages.map((message, index) => (
      <LLMChatMessage key={index} message={message} classes={classes} />
    ))}
  </div>


  // const exportHistoryToClipboard = () => {
  //   if (!currentConversation) return
  //   const conversationHistory = currentConversation.messages
  //   const firstMessage = conversationHistory[0]
  //   // TODO: revert this change
  //   // const firstMessageFormatted = `**${firstMessage.role}**: ${firstMessage.displayContent ?? firstMessage.content}\n\n\n`
  //   const firstMessageFormatted = `**${firstMessage.role}**: ${firstMessage.content}\n\n\n`
  //   const formattedChatHistory = conversationHistory.slice(1).map(({role, content}) => `**${role}**: ${content}`).join("\n\n\n")
  //   void navigator.clipboard.writeText(firstMessageFormatted + formattedChatHistory)
  //   flash('Chat history copied to clipboard')
  // }

  const onSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelection = event.target.value

    if (newSelection === "New Conversation") {
      switchConversation(undefined)
    } else {
      // TODO: have a separate field for last viewed
      switchConversation(newSelection)
    }
  }

  const deleteConversation = (ev: React.MouseEvent, conversationId: string) => {
    ev.preventDefault()
    ev.stopPropagation()
    const updatedConversations: LlmConversations = Object.keys(llmConversations).filter(key => key !== `llmChatHistory:${title}`).reduce((acc, key) => ({...acc, [key]: llmConversations[key]}), {})

    // TODO: it is possible to overwrite a conversation if another is generated with the same title
    ls?.setItem(LLM_STORAGE_KEY, JSON.stringify(updatedConversations))
    setLlmConversations(updatedConversations)
    if (currentConversation?.title === title) {
      setWindowTitle?.(PLACEHOLDER_TITLE)
      setCurrentConversation(null)
    }
  }

  const appendLatestMessage = useCallback((message: LlmStreamMessage) => {
    console.log(`Got message from stream!  ${message.data.content}`);
    const storageTitle = `llmChatHistory:${message.data.title}`;
    const previousConversation = llmConversations[storageTitle];
    const conversationWithNewResponse: ClaudeConversation = {
      ...previousConversation,
      messages: [...previousConversation.messages, { ...message.data, role: 'assistant' }]
    };
    setCurrentConversation(conversationWithNewResponse)

    const updatedConversations = {...llmConversations, [storageTitle]: conversationWithNewResponse}
    ls?.setItem(LLM_STORAGE_KEY, JSON.stringify(updatedConversations))
    setLlmConversations(updatedConversations)
  }, [llmConversations]);

  useOnServerSentEvent('llmStream', currentUser, (message) => {
    appendLatestMessage(message);
    setLoading(false);
  });

  useOnServerSentEvent('llmSetTitle', currentUser, (message) => {
    console.log(`Got title from stream!  ${message.title}`, { setWindowTitleExists: !!setWindowTitle });
    setWindowTitle?.(message.title);
    const storageTitle = `llmChatHistory:${message.title}`;
    const updatedConversations: LlmConversations = {...llmConversations, [storageTitle]: { createdAt: new Date(), lastUpdated: new Date(), messages: currentConversation?.messages ?? [], title: message.title }};
    ls?.setItem(LLM_STORAGE_KEY, JSON.stringify(updatedConversations));
    setLlmConversations(updatedConversations);
  });


  
  const conversationSelect = <Select 
    onChange={onSelect} 
    value={currentConversation?.title ?? "New Conversation"}
    disableUnderline
    className={classes.select}
    MenuProps={{style: {zIndex: 10000000002}}} // TODO: figure out sensible z-index stuff
    renderValue={(title: string) =>title}
    >
      {
        .map(({ title, _id }, index) => (
          <MenuItem key={index} value={_id} className={classes.menuItem}>
            {title}
            <CloseIcon onClick={(ev) => deleteConversation(ev, _id)} className={classes.deleteConvoIcon} />
          </MenuItem>
      ))}
      <MenuItem value="New Conversation" className={classes.menuItem}>
        New Conversation
      </MenuItem>
    </Select>;


  const options = <div className={classes.options}>
    <Button onClick={resetConversation}>
      New Chat
    </Button>
    <Button onClick={exportHistoryToClipboard} disabled={!currentConversation}>
      Export
    </Button>
    {conversationSelect}
  </div>

  return <div className={classes.chatInterfaceRoot}>
    {messagesForDisplay}
    {loading && <Loading className={classes.loadingSpinner}/>}
    <LLMInputTextbox onSubmit={messageSubmit} classes={classes} />
    {options}
  </div>
}


// Wrapper component needed so we can use deferRender
export const LanguageModelChat = ({setTitle, classes}: {
  setTitle?: (title: string) => void,
  classes: ClassesType<typeof styles>,
}) => {

  return <DeferRender ssr={false}>
    <div className={classes.root}>
      <ChatInterface setWindowTitle={setTitle} classes={classes} />
    </div>
  </DeferRender>
}

const LanguageModelChatComponent = registerComponent('LanguageModelChat', LanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelChat: typeof LanguageModelChatComponent
  }
}
