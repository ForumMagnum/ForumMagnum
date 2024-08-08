// TODO: Import component in components.ts
import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useMutation } from '@apollo/client';
import classNames from 'classnames';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import DeferRender from '../common/DeferRender';
import Checkbox from "@material-ui/core/Checkbox";
import { commentBodyStyles } from '@/themes/stylePiping';
import Button from '@material-ui/core/Button';
import { useMessages } from '../common/withMessages';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';

const LLM_STORAGE_KEY = 'llmConversations'

const styles = (theme: ThemeType) => ({
  root: {
  },
  chatInterfaceRoot: {

  },
  submission: {
    margin: 10,
    display: "flex",
    ...theme.typography.commentStyle,
  },
  inputTextbox: {
    width: "100%",
    minHeight: 100,
    maxHeight: 200,
  },
  chatMessage: {
    ...commentBodyStyles(theme),
    padding: 20,
    margin: 10,
    borderRadius: 10
  },
  chatMessageContent: {
    fontSize: 10
  },
  userMessage: {
    backgroundColor: theme.palette.grey[300],
  },
  assistantMessage: {
    backgroundColor: theme.palette.grey[100],
  },
  messages: {
    maxHeight: "50vh",
    overflowY: "scroll",
  },
  messagesFullPage: {
    height: "calc(100vh - 250px)",
    maxHeight: "unset"
  },
  options: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginLeft: 10
  },
  checkbox: {
    padding: 8
  },
  select: {
    // TODO: really the styling of the options section should be flex display and flex grow stuff
    maxWidth: 250,
  },
  menuItem: {
    zIndex: theme.zIndexes.commentBoxPopup + 10
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

type LlmConversations = Record<string, ClaudeConversation>

const LLMChatMessage = ({message, classes}: {
  message: ClaudeMessage,
  classes: ClassesType<typeof styles>,
}) => {

  const { ContentItemBody, ContentStyles } = Components

  const { role, content, displayContent } = message

  return <ContentStyles contentType="tag" className={classes.chatMessageContent}>
    <ContentItemBody
      className={classNames(classes.chatMessage, {[classes.userMessage]: role==='user', [classes.assistantMessage]: role==='assistant'})}
      dangerouslySetInnerHTML={{__html: displayContent ?? content}}
    />
</ContentStyles>
}

export const ChatInterface = ({fullPage, setWindowTitle, classes}: {
  fullPage?: boolean,
  setWindowTitle?: (title: string) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { Loading, MenuItem } = Components

  const { flash } = useMessages()


  const messagesRef = useRef<HTMLDivElement>(null)

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($messages: [ClaudeMessage!]!, $useRag: Boolean, $title: String) {
      sendClaudeMessage(messages: $messages, useRag: $useRag, title: $title)
    }
  `)

  const [useRag, setUseRag] = useState(true)
  const [loading, setLoading] = useState(false)

  const ls = getBrowserLocalStorage();
  const storedLlmConversations = ls?.getItem(LLM_STORAGE_KEY);
  const llmConversations: LlmConversations = storedLlmConversations ? JSON.parse(storedLlmConversations) : {}

  // TODO: if using lastUpdated to select converation, this could override thet last selected
  console.log({llmConversations: Object.values(llmConversations).map(({title, lastUpdated}: {title: string, lastUpdated: Date}) => ({title, lastUpdated}))})
  const mostRecentConversationTitle = Object.values(llmConversations).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]?.title

  const [currentMessage, setCurrentMessage] = useState('')
    
  const [currentConversation, setCurrentConversation] = useState<ClaudeConversation|null>(llmConversations[`llmChatHistory:${mostRecentConversationTitle}`])
  setWindowTitle?.(currentConversation?.title ?? "LLM Chat: New Conversation")

  // useEffect to scroll to bottom of chat history (or page on full-window llm but that needs fixing)
  useEffect(() => {
    //TODO: this scrolling to the bottom is if this on standalone page, not in a popup
    // window.scrollTo(0, document.body.scrollHeight);

    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [currentConversation?.title]);


  const messages = <div className={classNames(classes.messages, {[classes.messagesFullPage]: fullPage})} ref={messagesRef}>
    {currentConversation?.messages.map((message, index) => (
      <LLMChatMessage key={index} message={message} classes={classes} />
    ))}
  </div>

// TODO: Ensure code is sanitized against injection attacks
  const messageSubmit = async () => {
    let newMessage = { role: "user", content: currentMessage }

    const updatedConversationHistory = [...currentConversation?.messages ?? [], newMessage]
    setCurrentMessage("")
    setLoading(true)
  
    setTimeout(async () => {
      const result = await sendClaudeMessage({
        variables: {
          messages: updatedConversationHistory,
          useRag,
          title: currentConversation?.title
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
    }, 0)

  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();
      void messageSubmit();
    }
  }

  const clearChatHistory = () => {
    // ls?.removeItem('llmChatHistory')
    setWindowTitle?.("LLM Chat: New Conversation")
    setCurrentConversation(null)
  }
  
  const input = (
    <div className={classes.submission}>
      <Input
        value={currentMessage}
        onChange={(event) => setCurrentMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        className={classes.inputTextbox}
        placeholder='Type here. Ctrl-Enter to send.'
        multiline
        disableUnderline
      />
      {/* <textarea 
        value={currentMessage} 
        onChange={(event) => setCurrentMessage(event.target.value)} 
        onKeyDown={handleKeyDown} 
        className={classes.inputTextbox} 
        draggable={false}
        placeholder='Cmd-Enter to send'
      /> */}
    </div>
  )

  const exportHistoryToClipboard = () => {
    // use role and content from each chat message to format the chat history
    if (!currentConversation) return
    const conversationHistory = currentConversation.messages
    const firstMessage = conversationHistory[0]
    const firstMessageFormatted = `**${firstMessage.role}**: ${firstMessage.displayContent ?? firstMessage.content}\n\n\n`
    const formattedChatHistory = conversationHistory.slice(1).map(({role, content}) => `**${role}**: ${content}`).join("\n\n\n")
    void navigator.clipboard.writeText(firstMessageFormatted + formattedChatHistory)
    flash('Chat history copied to clipboard')
  }

  const onSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelection = event.target.value

    if (newSelection === "New Conversation") {
      setWindowTitle?.("LLM Chat: New Conversation")
      setCurrentConversation(null)
    } else {
      // TODO: have a separate field for last viewed
      const newlySelectedConversation = {...llmConversations[`llmChatHistory:${newSelection}`], lastUpdated: new Date()}
      const storageTitle = `llmChatHistory:${newlySelectedConversation.title}`
      const updatedConversations = {...llmConversations, [storageTitle]: newlySelectedConversation}
      ls?.setItem(LLM_STORAGE_KEY, JSON.stringify(updatedConversations))
      setCurrentConversation(newlySelectedConversation)
      setWindowTitle?.(newlySelectedConversation?.title ?? "LLM Chat: New Conversation")
    }
  }
  
  const conversationSelect = <Select 
    onChange={onSelect} 
    value={currentConversation?.title ?? "New Conversation"}
    disableUnderline
    className={classes.select}
    MenuProps={{style: {zIndex: 10000000002}}}
    >
      <MenuItem value="New Conversation" className={classes.menuItem}>
        New Conversation
      </MenuItem>
      {Object.values(llmConversations).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .map(({ title }, index) => (
          <MenuItem key={index} value={title} className={classes.menuItem}>
            {title}
          </MenuItem>
      ))}
    </Select>;


  const options = <div className={classes.options}>
    Use RAG <Checkbox checked={useRag} onChange={() => setUseRag(!useRag)} className={classes.checkbox} />
    <Button onClick={clearChatHistory}>
      New Chat
    </Button>
    <Button onClick={exportHistoryToClipboard}>
      Export
    </Button>
    {/* only show selector if there are more than two conversations in llmConversations */}
    {Object.keys(llmConversations).length > 1 && conversationSelect}
  </div>


  return <div className={classes.chatInterfaceRoot}>
    {messages}
    {loading && <Loading/>}
    {input}
    {options}
  </div>
}


export const LanguageModelChat = ({fullPage, setTitle, classes}: {
  fullPage?: boolean,
  setTitle?: (title: string) => void,
  classes: ClassesType<typeof styles>,
}) => {

  return <DeferRender ssr={false}>
    <div className={classes.root}>
      <ChatInterface fullPage={fullPage} setWindowTitle={setTitle} classes={classes} />
    </div>
  </DeferRender>
}

const LanguageModelChatComponent = registerComponent('LanguageModelChat', LanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelChat: typeof LanguageModelChatComponent
  }
}
