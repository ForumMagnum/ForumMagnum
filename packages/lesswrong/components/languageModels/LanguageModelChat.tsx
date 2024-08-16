// TODO: Import component in components.ts
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  setWindowTitle?: (title: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //TODO: appropriate tracking? 
  const { Loading, MenuItem } = Components

  const { flash } = useMessages()

  const { location } = useLocation();
  const { pathname } = location;
  const postId = pathname.match(/\/posts\/([^/]+)\/[^/]+/)?.[1]

  const messagesRef = useRef<HTMLDivElement>(null)

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($messages: [ClaudeMessage!]!, $promptContextOptions: PromptContextOptions!, $title: String) {
      sendClaudeMessage(messages: $messages, promptContextOptions: $promptContextOptions, title: $title)
    }
  `)

  const [getClaudeLoadingMessages] = useMutation(gql`
    mutation getClaudeLoadingMessagesMutation($messages: [ClaudeMessage!]!, $postId: String) {
      getClaudeLoadingMessages(messages: $messages, postId: $postId)
    }
  `)

  const [loading, setLoading] = useState(false)

  const ls = getBrowserLocalStorage();
  const storedLlmConversations = ls?.getItem(LLM_STORAGE_KEY);
  const [llmConversations, setLlmConversations] = useState<LlmConversations>(storedLlmConversations ? JSON.parse(storedLlmConversations) : {})

  // TODO: if using lastUpdated to select converation, this could override thet last selected
  console.log({llmConversations: Object.values(llmConversations).map(({title, lastUpdated}: {title: string, lastUpdated: Date}) => ({title, lastUpdated}))})
  const mostRecentConversationTitle = Object.values(llmConversations).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]?.title

  const [currentConversation, setCurrentConversation] = useState<ClaudeConversation|null>(llmConversations[`llmChatHistory:${mostRecentConversationTitle}`])
  setWindowTitle?.(currentConversation?.title ?? PLACEHOLDER_TITLE)

  // useEffect to scroll to bottom of chat history after new message is added
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [currentConversation?.messages.length]);


  const messages = <div className={classes.messages} ref={messagesRef}>
    {currentConversation?.messages.map((message, index) => (
      <LLMChatMessage key={index} message={message} classes={classes} />
    ))}
  </div>

// TODO: Ensure code is sanitized against injection attacks
  const messageSubmit = useCallback(async (message: string) => {
    let newMessage = { role: "user", content: message }

    const messagesWithNewUserQuery = [...currentConversation?.messages ?? [], newMessage]
    const conversationWithNewUserQuery: ClaudeConversationWithOptionalTitle = { 
      createdAt: new Date(),
      ...currentConversation, // will preserve title and createdAt if they exist
      messages: messagesWithNewUserQuery,
      lastUpdated: new Date()
    }
    setLoading(true)
    setCurrentConversation({...conversationWithNewUserQuery, title: currentConversation?.title ?? PLACEHOLDER_TITLE})
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }

    const promptContextOptions: PromptContextOptions = {
      query: message, // not super reliably after first message, but should work for first message for now
      postId,
      includeComments: true //TODO: not always true?
    }

    setTimeout(async () => {
      const result0 = await getClaudeLoadingMessages({
        variables: {
          messages: messagesWithNewUserQuery,
          postId
        }
      })      


      const result = await sendClaudeMessage({
        variables: {
          messages: messagesWithNewUserQuery,
          promptContextOptions,
          title: conversationWithNewUserQuery?.title
        }
      })

      const conversationResponse: ClaudeConversation = result.data.sendClaudeMessage
      const { messages: conversationHistoryWithNewResponse, title: newTitle } = conversationResponse

      const conversationWithNewResponse = {
        messages: conversationHistoryWithNewResponse,
        title: conversationResponse.title,
        createdAt: currentConversation?.createdAt ?? new Date(),
        lastUpdated: new Date()
      }
      setLoading(false)
      setCurrentConversation(conversationWithNewResponse)
      setWindowTitle?.(newTitle)

      const storageTitle = `llmChatHistory:${conversationResponse.title}`
      const updatedConversations = {...llmConversations, [storageTitle]: conversationWithNewResponse}
      ls?.setItem(LLM_STORAGE_KEY, JSON.stringify(updatedConversations))
      setLlmConversations(updatedConversations)
    }, 0)

  }, [currentConversation, sendClaudeMessage, getClaudeLoadingMessages, setLoading, setCurrentConversation, setWindowTitle, llmConversations, ls, postId]);

  const newChat = () => {
    setWindowTitle?.(PLACEHOLDER_TITLE)
    setCurrentConversation(null)
  }
  
  const exportHistoryToClipboard = () => {
    if (!currentConversation) return
    const conversationHistory = currentConversation.messages
    const firstMessage = conversationHistory[0]
    // TODO: revert this change
    // const firstMessageFormatted = `**${firstMessage.role}**: ${firstMessage.displayContent ?? firstMessage.content}\n\n\n`
    const firstMessageFormatted = `**${firstMessage.role}**: ${firstMessage.content}\n\n\n`
    const formattedChatHistory = conversationHistory.slice(1).map(({role, content}) => `**${role}**: ${content}`).join("\n\n\n")
    void navigator.clipboard.writeText(firstMessageFormatted + formattedChatHistory)
    flash('Chat history copied to clipboard')
  }

  const onSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelection = event.target.value

    if (newSelection === "New Conversation") {
      setWindowTitle?.(PLACEHOLDER_TITLE)
      setCurrentConversation(null)
    } else {
      // TODO: have a separate field for last viewed
      const newlySelectedConversation = {...llmConversations[`llmChatHistory:${newSelection}`], lastUpdated: new Date()}
      const storageTitle = `llmChatHistory:${newlySelectedConversation.title}`
      const updatedConversations = {...llmConversations, [storageTitle]: newlySelectedConversation}
      ls?.setItem(LLM_STORAGE_KEY, JSON.stringify(updatedConversations))
      setLlmConversations(updatedConversations)
      setCurrentConversation(newlySelectedConversation)
      setWindowTitle?.(newlySelectedConversation?.title ?? PLACEHOLDER_TITLE)
    }
  }

  const deleteConversation = (ev: React.MouseEvent, title: string) => {
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
  
  const conversationSelect = <Select 
    onChange={onSelect} 
    value={currentConversation?.title ?? "New Conversation"}
    disableUnderline
    className={classes.select}
    MenuProps={{style: {zIndex: 10000000002}}} // TODO: figure out sensible z-index stuff
    renderValue={(title: string) =>title}
    >
      {Object.values(llmConversations).sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime())
        .map(({ title }, index) => (
          <MenuItem key={index} value={title} className={classes.menuItem}>
            {title}
            <CloseIcon onClick={(ev) => deleteConversation(ev, title)} className={classes.deleteConvoIcon} />
          </MenuItem>
      ))}
      <MenuItem value="New Conversation" className={classes.menuItem}>
        New Conversation
      </MenuItem>
    </Select>;


  const options = <div className={classes.options}>
    <Button onClick={newChat}>
      New Chat
    </Button>
    <Button onClick={exportHistoryToClipboard} disabled={!currentConversation}>
      Export
    </Button>
    {conversationSelect}
  </div>

  return <div className={classes.chatInterfaceRoot}>
    {messages}
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
