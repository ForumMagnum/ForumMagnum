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
  options: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginLeft: 10
  },
  checkbox: {
    padding: 8
  }
});

interface ClaudeMessage {
  role: string
  content: string
  displayContent?: string
}


const LLMChatMessage = ({message, classes}: {
  message: ClaudeMessage,
  classes: ClassesType<typeof styles>,
}) => {

  const { ContentItemBody, ContentStyles } = Components

  const { role, content, displayContent } = message

  return <ContentStyles contentType="tag">
    <ContentItemBody
      className={classNames(classes.chatMessage, {[classes.userMessage]: role==='user', [classes.assistantMessage]: role==='assistant'})}
      dangerouslySetInnerHTML={{__html: displayContent ?? content}}
    />
</ContentStyles>
}


export const ChatInterface = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { Loading } = Components


  // useEffect to scroll to bottom of page
  useEffect(() => {
    //TODO: this scrolling to the bottom is if this on standalone page, not in a popup
    // window.scrollTo(0, document.body.scrollHeight);

    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  const messagesRef = useRef<HTMLDivElement>(null)

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($messages: [ClaudeMessage!]!, $useRag: Boolean) {
      sendClaudeMessage(messages: $messages, useRag: $useRag)
    }
  `)

  const ls = getBrowserLocalStorage();
  const storedChatHistory = ls?.getItem('llmChatHistory');
  const initialConversationHistory = storedChatHistory ? JSON.parse(storedChatHistory) : []

  const { flash } = useMessages()

  const [useRag, setUseRag] = useState(true)
  const [loading, setLoading] = useState(false)

  const [currentMessage, setCurrentMessage] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ClaudeMessage[]>(initialConversationHistory)

  const messages = <div className={classes.messages} ref={messagesRef}>
    {conversationHistory.map((message, index) => (
      <LLMChatMessage key={index} message={message} classes={classes} />
    ))}
  </div>

// TODO: Ensure code is sanitized against injection attacks
  const messageSubmit = async () => {
    let newMessage = { role: "user", content: currentMessage }

    const updatedConversationHistory = [...conversationHistory, newMessage]
    setConversationHistory(updatedConversationHistory)
    setCurrentMessage("")
    setLoading(true)
  
    setTimeout(async () => {
      const result = await sendClaudeMessage({
        variables: {
          messages: updatedConversationHistory,
          useRag
        }
      })

      const conversationHistoryWithNewResponse = result.data.sendClaudeMessage
      setLoading(false)
      setConversationHistory(conversationHistoryWithNewResponse)
      ls?.setItem('llmChatHistory', JSON.stringify(conversationHistoryWithNewResponse))
      console.log(messageSubmit, {conversationHistoryWithNewResponse})
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
    ls?.removeItem('llmChatHistory')
    setConversationHistory([])
  }
  
  const input = (
    <div className={classes.submission}>
      <textarea 
        value={currentMessage} 
        onChange={(event) => setCurrentMessage(event.target.value)} 
        onKeyDown={handleKeyDown} 
        className={classes.inputTextbox} 
        draggable={false}
        placeholder='Cmd-Enter to send'
      />
    </div>
  )

  const exportHistoryToClipboard = () => {
    // use role and content from each chat message to format the chat history
    const firstMessage = conversationHistory[0]
    const firstMessageFormatted = `**${firstMessage.role}**: ${firstMessage.displayContent ?? firstMessage.content}\n\n\n`
    const formattedChatHistory = conversationHistory.slice(1).map(({role, content}) => `**${role}**: ${content}`).join("\n\n\n")
    void navigator.clipboard.writeText(firstMessageFormatted + formattedChatHistory)
    flash('Chat history copied to clipboard')
  }

  const options = <div className={classes.options}>
    Use RAG <Checkbox checked={useRag} onChange={() => setUseRag(!useRag)} className={classes.checkbox} />
    <Button onClick={clearChatHistory}>
      Clear History
    </Button>
    {/* button to export chat history to clipboard*/}
    <Button onClick={exportHistoryToClipboard}>
      Export
    </Button>
  </div>


  return <div className={classes.chatInterfaceRoot}>
    {messages}
    {loading && <Loading/>}
    {input}
    {options}
  </div>
}


export const LanguageModelChat = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { SingleColumnSection } = Components

  return <DeferRender ssr={false}>
    <div className={classes.root}>
      <ChatInterface classes={classes} />
    </div>
  </DeferRender>
}

const LanguageModelChatComponent = registerComponent('LanguageModelChat', LanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelChat: typeof LanguageModelChatComponent
  }
}
